<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { z } from 'zod'
import { ArrowLeft, ExternalLink, Save, Send, Undo2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect } from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PageHeader from '@/components/common/PageHeader.vue'
import FormField from '@/components/common/FormField.vue'
import ImageField from '@/components/common/ImageField.vue'
import MarkdownEditor from '@/components/common/MarkdownEditor.vue'
import SeoFields from '@/components/common/SeoFields.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { articleService, categoryService, tagService } from '@/services/admin'
import { errorMessage } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useContentEditor } from '@/composables/useContentEditor'
import { useFormSubmit } from '@/composables/useFormSubmit'
import { slugify } from '@/utils/slug'
import { contentStatusSchema, slugSchema } from '@/utils/validation'
import { formatDateTime, fromDateTimeLocal, toDateTimeLocal } from '@/utils/format'
import { toPlainText } from '@/utils/markdown'
import type { Article, ArticleInput, Category, ContentStatus, Tag } from '@/types'
import { deepClone } from '@/utils/clone'

const router = useRouter()
const auth = useAuthStore()

const form = reactive<ArticleInput>({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  featuredImage: null,
  categoryId: null,
  tagIds: [],
  status: 'DRAFT',
  publishedAt: null,
  seo: {},
})
const current = ref<Article | null>(null)
const categories = ref<Category[]>([])
const tags = ref<Tag[]>([])
const loading = ref(false)
const slugTouched = ref(false)
const tab = ref('content')

const { id, isNew, dirty, markClean } = useContentEditor(() => form)
const { errors, submitting, validate, submit } = useFormSubmit()

const canEdit = computed(() => auth.can(isNew.value ? 'article.create' : 'article.update'))
const canPublish = computed(() => auth.can('article.publish'))
const publishedAtLocal = computed({
  get: () => toDateTimeLocal(form.publishedAt),
  set: (v: string) => (form.publishedAt = fromDateTimeLocal(v)),
})
const categoryOptions = computed(() =>
  categories.value.map((c) => ({ label: c.name, value: c.id })),
)

watch(
  () => form.title,
  (t) => {
    if (!slugTouched.value && isNew.value) form.slug = slugify(t)
  },
)

const schema = z.object({
  title: z.string().trim().min(1, 'Judul wajib diisi').max(200),
  slug: slugSchema,
  excerpt: z.string().max(300, 'Maksimal 300 karakter').nullish(),
  content: z.string().trim().min(1, 'Konten wajib diisi'),
  status: contentStatusSchema,
})

function fill(a: Article) {
  current.value = a
  Object.assign(form, {
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt ?? '',
    content: a.content,
    featuredImage: a.featuredImage ?? null,
    categoryId: a.category?.id ?? null,
    tagIds: a.tags.map((t) => t.id),
    status: a.status,
    publishedAt: a.publishedAt ?? null,
    seo: { ...(a.seo ?? {}) },
  })
  slugTouched.value = true
  markClean()
}

onMounted(async () => {
  const [c, t] = await Promise.all([
    categoryService.list({ perPage: 100 }).catch(() => ({ data: [] as Category[] })),
    tagService.list({ perPage: 100 }).catch(() => ({ data: [] as Tag[] })),
  ])
  categories.value = c.data
  tags.value = t.data
  if (isNew.value) return markClean()
  loading.value = true
  try {
    fill(await articleService.get(id.value!))
  } catch (e) {
    toast.error(errorMessage(e))
    router.replace('/admin/articles')
  } finally {
    loading.value = false
  }
})

function generateExcerpt() {
  form.excerpt = toPlainText(form.content).slice(0, 200)
}

async function save(status?: ContentStatus) {
  const payload: ArticleInput = deepClone({ ...form, status: status ?? form.status })
  if (!validate(schema, payload)) {
    tab.value = 'content'
    return
  }
  const saved = await submit(
    () =>
      isNew.value ? articleService.create(payload) : articleService.update(id.value!, payload),
    status === 'PUBLISHED' ? 'Artikel dipublikasikan' : 'Artikel disimpan',
  )
  if (!saved) return
  fill(saved)
  if (isNew.value) router.replace(`/admin/articles/${saved.id}`)
}
</script>

<template>
  <div>
    <PageHeader :title="isNew ? 'Tulis Artikel' : form.title || 'Edit Artikel'">
      <template #breadcrumb>
        <RouterLink
          to="/admin/articles"
          class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft class="size-4" /> Articles
        </RouterLink>
      </template>
      <template #actions>
        <span v-if="dirty" class="text-muted-foreground text-xs">Belum disimpan</span>
        <Button v-if="current?.status === 'PUBLISHED'" as-child variant="ghost">
          <a :href="`/news/${current.slug}`" target="_blank" rel="noopener"
            ><ExternalLink /> Lihat</a
          >
        </Button>
        <template v-if="canEdit">
          <Button
            v-if="canPublish && current?.status === 'PUBLISHED'"
            variant="outline"
            :disabled="submitting"
            @click="save('DRAFT')"
            ><Undo2 /> Unpublish</Button
          >
          <Button variant="outline" :loading="submitting" @click="save()"><Save /> Simpan</Button>
          <Button
            v-if="canPublish && current?.status !== 'PUBLISHED'"
            :disabled="submitting"
            @click="save('PUBLISHED')"
            ><Send /> Publish</Button
          >
        </template>
      </template>
    </PageHeader>

    <div v-if="loading" class="grid gap-4"><Skeleton class="h-12" /><Skeleton class="h-96" /></div>
    <div v-else class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Tabs v-model="tab" default-value="content">
        <TabsList>
          <TabsTrigger value="content">Konten</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>
        <TabsContent value="content">
          <Card>
            <CardContent class="grid gap-4">
              <FormField label="Judul" for="title" :error="errors.title" required>
                <Input id="title" v-model="form.title" />
              </FormField>
              <FormField
                label="Slug"
                for="slug"
                :error="errors.slug"
                :hint="`URL: /news/${form.slug}`"
                required
              >
                <Input
                  id="slug"
                  v-model="form.slug"
                  class="font-mono"
                  @input="slugTouched = true"
                />
              </FormField>
              <FormField label="Ringkasan (Excerpt)" for="excerpt" :error="errors.excerpt">
                <Textarea id="excerpt" v-model="form.excerpt" rows="3" />
                <button
                  type="button"
                  class="text-muted-foreground hover:text-foreground w-fit text-xs underline"
                  @click="generateExcerpt"
                >
                  Buat otomatis dari konten
                </button>
              </FormField>
              <FormField label="Konten" for="content" :error="errors.content" required>
                <MarkdownEditor id="content" v-model="form.content" :rows="18" />
              </FormField>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="seo">
          <Card>
            <CardContent>
              <SeoFields
                v-model="form.seo!"
                :fallback-title="form.title"
                :fallback-description="form.excerpt ?? ''"
                :path="`/news/${form.slug}`"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div class="grid content-start gap-4">
        <Card class="gap-4">
          <CardHeader><CardTitle class="text-base">Publikasi</CardTitle></CardHeader>
          <CardContent class="grid gap-4">
            <div v-if="current" class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Status saat ini</span>
              <StatusBadge :status="current.status" />
            </div>
            <FormField label="Status" for="status">
              <NativeSelect id="status" v-model="form.status" :disabled="!canPublish">
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </NativeSelect>
            </FormField>
            <FormField
              label="Tanggal Publikasi"
              for="publishedAt"
              hint="Tanggal di masa depan = terjadwal"
            >
              <Input id="publishedAt" v-model="publishedAtLocal" type="datetime-local" />
            </FormField>
            <p v-if="current" class="text-muted-foreground text-xs">
              Oleh {{ current.author?.name ?? '—' }} · diperbarui
              {{ formatDateTime(current.updatedAt) }}
            </p>
          </CardContent>
        </Card>
        <Card class="gap-4">
          <CardHeader><CardTitle class="text-base">Kategori & Tag</CardTitle></CardHeader>
          <CardContent class="grid gap-4">
            <FormField label="Kategori" for="category">
              <Combobox
                id="category"
                v-model="form.categoryId"
                :options="categoryOptions"
                placeholder="— Tanpa kategori —"
              />
            </FormField>
            <div class="grid gap-2">
              <span class="text-sm font-medium">Tag</span>
              <p v-if="!tags.length" class="text-muted-foreground text-xs">Belum ada tag.</p>
              <label v-for="t in tags" :key="t.id" class="flex items-center gap-2 text-sm">
                <Checkbox v-model="form.tagIds" :value="t.id" /> {{ t.name }}
              </label>
            </div>
          </CardContent>
        </Card>
        <Card class="gap-4">
          <CardHeader><CardTitle class="text-base">Featured Image</CardTitle></CardHeader>
          <CardContent><ImageField v-model="form.featuredImage" folder="articles" /></CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
