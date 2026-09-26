<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { z } from 'zod'
import { ArrowLeft, ExternalLink, Save, Send, Undo2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PageHeader from '@/components/common/PageHeader.vue'
import FormField from '@/components/common/FormField.vue'
import ImageField from '@/components/common/ImageField.vue'
import MarkdownEditor from '@/components/common/MarkdownEditor.vue'
import SeoFields from '@/components/common/SeoFields.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import SectionBuilder from '@/components/sections/SectionBuilder.vue'
import { validateSection } from '@/components/sections/registry'
import { pageService } from '@/services/admin'
import { errorMessage } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useContentEditor } from '@/composables/useContentEditor'
import { useFormSubmit } from '@/composables/useFormSubmit'
import { slugify } from '@/utils/slug'
import { contentStatusSchema, slugSchema } from '@/utils/validation'
import { formatDateTime, fromDateTimeLocal, toDateTimeLocal } from '@/utils/format'
import type { ContentStatus, Page, PageInput } from '@/types'
import { deepClone } from '@/utils/clone'

const router = useRouter()
const auth = useAuthStore()

const form = reactive<PageInput>({
  title: '',
  slug: '',
  content: '',
  featuredImage: null,
  status: 'DRAFT',
  publishedAt: null,
  sections: [],
  seo: {},
})
const current = ref<Page | null>(null)
const loading = ref(false)
const slugTouched = ref(false)
const tab = ref('sections')

const { id, isNew, dirty, markClean } = useContentEditor(() => form)
const { errors, submitting, validate, submit } = useFormSubmit()

const canEdit = computed(() => auth.can(isNew.value ? 'page.create' : 'page.update'))
const canPublish = computed(() => auth.can('page.publish'))
const publishedAtLocal = computed({
  get: () => toDateTimeLocal(form.publishedAt),
  set: (v: string) => (form.publishedAt = fromDateTimeLocal(v)),
})
const publicPath = computed(() => (form.slug === 'home' ? '/' : `/${form.slug}`))

watch(
  () => form.title,
  (title) => {
    if (!slugTouched.value && isNew.value) form.slug = slugify(title)
  },
)

const schema = z.object({
  title: z.string().trim().min(1, 'Judul wajib diisi').max(200),
  slug: slugSchema,
  status: contentStatusSchema,
})

function fill(p: Page) {
  current.value = p
  Object.assign(form, {
    title: p.title,
    slug: p.slug,
    content: p.content ?? '',
    featuredImage: p.featuredImage ?? null,
    status: p.status,
    publishedAt: p.publishedAt ?? null,
    sections: deepClone(p.sections ?? []).sort((a, b) => a.sortOrder - b.sortOrder),
    seo: { ...(p.seo ?? {}) },
  })
  slugTouched.value = true
  markClean()
}

onMounted(async () => {
  if (isNew.value) return markClean()
  loading.value = true
  try {
    fill(await pageService.get(id.value!))
  } catch (e) {
    toast.error(errorMessage(e))
    router.replace('/admin/pages')
  } finally {
    loading.value = false
  }
})

async function save(status?: ContentStatus) {
  const payload: PageInput = deepClone({ ...form, status: status ?? form.status })
  if (!validate(schema, payload)) {
    tab.value = 'general'
    return
  }
  const sectionErrors = payload.sections.flatMap(validateSection)
  if (sectionErrors.length) {
    tab.value = 'sections'
    toast.error(sectionErrors[0]!, {
      description:
        sectionErrors.length > 1 ? `+${sectionErrors.length - 1} kesalahan lainnya` : undefined,
    })
    return
  }
  payload.sections = payload.sections.map((s, i) => ({ ...s, key: undefined, sortOrder: i + 1 }))
  const saved = await submit(
    () => (isNew.value ? pageService.create(payload) : pageService.update(id.value!, payload)),
    status === 'PUBLISHED' ? 'Page dipublikasikan' : 'Page disimpan',
  )
  if (!saved) return
  fill(saved)
  if (isNew.value) router.replace(`/admin/pages/${saved.id}`)
}
</script>

<template>
  <div>
    <PageHeader :title="isNew ? 'Buat Page' : form.title || 'Edit Page'">
      <template #breadcrumb>
        <RouterLink
          to="/admin/pages"
          class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft class="size-4" /> Pages
        </RouterLink>
      </template>
      <template #actions>
        <span v-if="dirty" class="text-muted-foreground text-xs">Belum disimpan</span>
        <Button v-if="current?.status === 'PUBLISHED'" as-child variant="ghost">
          <a :href="publicPath" target="_blank" rel="noopener"><ExternalLink /> Lihat</a>
        </Button>
        <template v-if="canEdit">
          <Button
            v-if="canPublish && current?.status === 'PUBLISHED'"
            variant="outline"
            :disabled="submitting"
            @click="save('DRAFT')"
          >
            <Undo2 /> Unpublish
          </Button>
          <Button variant="outline" :loading="submitting" data-testid="save-page" @click="save()"
            ><Save /> Simpan</Button
          >
          <Button
            v-if="canPublish && current?.status !== 'PUBLISHED'"
            :disabled="submitting"
            data-testid="publish-page"
            @click="save('PUBLISHED')"
          >
            <Send /> Publish
          </Button>
        </template>
      </template>
    </PageHeader>

    <div v-if="loading" class="grid gap-4"><Skeleton class="h-12" /><Skeleton class="h-96" /></div>
    <div v-else class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Tabs v-model="tab" default-value="sections">
        <TabsList>
          <TabsTrigger value="general">Umum</TabsTrigger>
          <TabsTrigger value="sections" data-testid="tab-sections"
            >Sections ({{ form.sections.length }})</TabsTrigger
          >
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <Card>
            <CardContent class="grid gap-4">
              <FormField label="Judul" for="title" :error="errors.title" required>
                <Input id="title" v-model="form.title" data-testid="page-title-input" />
              </FormField>
              <FormField
                label="Slug"
                for="slug"
                :error="errors.slug"
                :hint="`URL: ${publicPath}`"
                required
              >
                <Input
                  id="slug"
                  v-model="form.slug"
                  class="font-mono"
                  data-testid="page-slug-input"
                  @input="slugTouched = true"
                />
              </FormField>
              <FormField
                label="Konten (opsional)"
                for="content"
                hint="Ditampilkan sebelum section. Mendukung Markdown."
              >
                <MarkdownEditor id="content" v-model="form.content as string" :rows="8" />
              </FormField>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sections">
          <SectionBuilder v-model="form.sections" />
        </TabsContent>
        <TabsContent value="seo">
          <Card>
            <CardContent>
              <SeoFields v-model="form.seo!" :fallback-title="form.title" :path="publicPath" />
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
              hint="Kosongkan untuk memakai waktu saat publish"
            >
              <Input id="publishedAt" v-model="publishedAtLocal" type="datetime-local" />
            </FormField>
            <p v-if="current" class="text-muted-foreground text-xs">
              Terakhir diperbarui {{ formatDateTime(current.updatedAt) }}
            </p>
          </CardContent>
        </Card>
        <Card class="gap-4">
          <CardHeader><CardTitle class="text-base">Featured Image</CardTitle></CardHeader>
          <CardContent><ImageField v-model="form.featuredImage" folder="pages" /></CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
