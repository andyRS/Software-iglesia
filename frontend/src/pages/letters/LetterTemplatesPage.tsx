import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  FileText,
  Loader2,
  Trash2,
  Pencil,
  Eye,
  Copy,
  Search,
  Calendar,
  User,
  Tag,
  Save,
  Send,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { lettersApi, personsApi } from '@/lib/api'
import { toast } from 'sonner'

interface LetterTemplate {
  _id: string
  name: string
  category: string
  content: string
  variables: string[]
  createdBy: { id: string; name: string }
  createdAt: string
  updatedAt: string
}

interface GeneratedLetter {
  _id: string
  templateName: string
  personName?: string
  recipientName?: string
  content: string
  generatedBy: { id: string; name: string }
  createdAt: string
}

const CATEGORIES = [
  'General',
  'Invitación',
  'Certificado',
  'Constancia',
  'Agradecimiento',
  'Recomendación',
  'Bautismo',
  'Membresía',
]

const AVAILABLE_VARIABLES = [
  { key: 'nombre', label: 'Nombre', desc: 'Nombre completo de la persona' },
  { key: 'fecha', label: 'Fecha', desc: 'Fecha actual formateada' },
  { key: 'iglesia', label: 'Iglesia', desc: 'Nombre de la iglesia' },
  { key: 'pastor', label: 'Pastor', desc: 'Nombre del pastor' },
  { key: 'ministerio', label: 'Ministerio', desc: 'Ministerio de la persona' },
  { key: 'telefono', label: 'Teléfono', desc: 'Teléfono de la persona' },
  { key: 'email', label: 'Email', desc: 'Email de la persona' },
]

const LetterTemplatesPage = () => {
  const [templates, setTemplates] = useState<LetterTemplate[]>([])
  const [generated, setGenerated] = useState<GeneratedLetter[]>([])
  const [persons, setPersons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  // Modal states
  const [showEditor, setShowEditor] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<LetterTemplate | null>(null)
  const [templateForm, setTemplateForm] = useState({
    name: '',
    category: 'General',
    content: '',
  })
  const [savingTemplate, setSavingTemplate] = useState(false)

  // Generate modal
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generateTemplate, setGenerateTemplate] = useState<LetterTemplate | null>(null)
  const [generatePersonId, setGeneratePersonId] = useState('')
  const [generating, setGenerating] = useState(false)

  // Preview modal
  const [showPreview, setShowPreview] = useState(false)
  const [previewContent, setPreviewContent] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')

  // History tab
  const [activeView, setActiveView] = useState<'templates' | 'history'>('templates')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [tRes, gRes, pRes] = await Promise.all([
        lettersApi.getTemplates(),
        lettersApi.getGenerated(),
        personsApi.getAll(),
      ])
      setTemplates(tRes.data.data)
      setGenerated(gRes.data.data)
      setPersons(pRes.data.data)
    } catch {
      toast.error('Error al cargar datos')
    }
    setLoading(false)
  }

  const openEditor = (template?: LetterTemplate) => {
    if (template) {
      setEditingTemplate(template)
      setTemplateForm({
        name: template.name,
        category: template.category,
        content: typeof template.content === 'string' ? template.content : JSON.stringify(template.content),
      })
    } else {
      setEditingTemplate(null)
      setTemplateForm({ name: '', category: 'General', content: '' })
    }
    setShowEditor(true)
  }

  const saveTemplate = async () => {
    if (!templateForm.name.trim()) return toast.error('Nombre requerido')
    if (!templateForm.content.trim()) return toast.error('Contenido requerido')
    setSavingTemplate(true)
    try {
      if (editingTemplate) {
        await lettersApi.updateTemplate(editingTemplate._id, templateForm)
        toast.success('Plantilla actualizada')
      } else {
        await lettersApi.createTemplate(templateForm)
        toast.success('Plantilla creada')
      }
      setShowEditor(false)
      loadData()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al guardar')
    }
    setSavingTemplate(false)
  }

  const deleteTemplate = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar plantilla "${name}"? Esta acción no se puede deshacer.`)) return
    try {
      await lettersApi.deleteTemplate(id)
      toast.success('Plantilla eliminada')
      loadData()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const duplicateTemplate = (template: LetterTemplate) => {
    setEditingTemplate(null)
    setTemplateForm({
      name: `${template.name} (Copia)`,
      category: template.category,
      content: typeof template.content === 'string' ? template.content : JSON.stringify(template.content),
    })
    setShowEditor(true)
  }

  const openGenerateModal = (template: LetterTemplate) => {
    setGenerateTemplate(template)
    setGeneratePersonId('')
    setShowGenerateModal(true)
  }

  const generateLetter = async () => {
    if (!generateTemplate || !generatePersonId) return toast.error('Selecciona una persona')
    setGenerating(true)
    try {
      await lettersApi.generate({
        templateId: generateTemplate._id,
        personId: generatePersonId,
      })
      toast.success('Carta generada exitosamente')
      setShowGenerateModal(false)
      loadData()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al generar')
    }
    setGenerating(false)
  }

  const previewTemplate = (template: LetterTemplate) => {
    const content = typeof template.content === 'string' ? template.content : JSON.stringify(template.content, null, 2)
    setPreviewContent(content)
    setPreviewTitle(template.name)
    setShowPreview(true)
  }

  const previewGeneratedLetter = (letter: GeneratedLetter) => {
    setPreviewContent(letter.content)
    setPreviewTitle(`${letter.templateName} - ${letter.personName || letter.recipientName || 'Destinatario'}`)
    setShowPreview(true)
  }

  const insertVariable = (varKey: string) => {
    setTemplateForm((prev) => ({
      ...prev,
      content: prev.content + `{{${varKey}}}`,
    }))
  }

  // Filtered templates
  const filteredTemplates = templates.filter((t) => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !filterCategory || t.category === filterCategory
    return matchSearch && matchCategory
  })

  const uniqueCategories = [...new Set(templates.map((t) => t.category))]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <p className="text-sm text-neutral-500">Cargando plantillas...</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Plantillas de Cartas</h1>
          <p className="text-neutral-500 mt-1">
            Crea y gestiona plantillas para cartas, certificados e invitaciones
          </p>
        </div>
        <Button onClick={() => openEditor()}>
          <Plus className="w-4 h-4 mr-1.5" />
          Nueva Plantilla
        </Button>
      </div>

      {/* View Toggle */}
      <div className="flex gap-1 p-1 bg-neutral-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveView('templates')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeView === 'templates'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-1.5" />
          Plantillas ({templates.length})
        </button>
        <button
          onClick={() => setActiveView('history')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeView === 'history'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-1.5" />
          Historial ({generated.length})
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'templates' ? (
          <motion.div
            key="templates"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Filters */}
            {templates.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar plantilla..."
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setFilterCategory('')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      !filterCategory
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                    }`}
                  >
                    Todas
                  </button>
                  {uniqueCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(filterCategory === cat ? '' : cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        filterCategory === cat
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Templates Grid */}
            {filteredTemplates.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="text-center py-16">
                  <FileText className="w-14 h-14 mx-auto mb-4 text-neutral-200" />
                  {templates.length === 0 ? (
                    <>
                      <h3 className="text-lg font-semibold text-neutral-700">No hay plantillas creadas</h3>
                      <p className="text-neutral-500 mt-1 max-w-md mx-auto">
                        Crea tu primera plantilla para generar cartas personalizadas con variables automáticas
                      </p>
                      <Button onClick={() => openEditor()} className="mt-5">
                        <Plus className="w-4 h-4 mr-1.5" />
                        Crear Primera Plantilla
                      </Button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-neutral-700">Sin resultados</h3>
                      <p className="text-neutral-500 mt-1">
                        No se encontraron plantillas que coincidan con tu búsqueda
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((template, i) => (
                  <motion.div
                    key={template._id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card className="border-0 shadow-sm hover:shadow-md transition-all group h-full flex flex-col">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 min-w-0 flex-1">
                            <CardTitle className="text-base truncate">{template.name}</CardTitle>
                            <Badge variant="secondary" className="text-[10px]">
                              <Tag className="w-3 h-3 mr-1" />
                              {template.category}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 flex-1 flex flex-col">
                        {/* Variables */}
                        {template.variables?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {template.variables.slice(0, 4).map((v) => (
                              <span
                                key={v}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-primary-50 text-primary-600 font-mono"
                              >
                                {`{{${v}}}`}
                              </span>
                            ))}
                            {template.variables.length > 4 && (
                              <span className="text-[10px] text-neutral-400">
                                +{template.variables.length - 4} más
                              </span>
                            )}
                          </div>
                        )}

                        {/* Content preview */}
                        <p className="text-xs text-neutral-400 line-clamp-2 mb-4 flex-1">
                          {typeof template.content === 'string'
                            ? template.content.replace(/\{\{[^}]+\}\}/g, '[...]').substring(0, 120)
                            : 'Contenido JSON'}
                        </p>

                        {/* Metadata */}
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-3">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {template.createdBy?.name}
                          </span>
                          <span>
                            {new Date(template.createdAt).toLocaleDateString('es-DO', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1.5 pt-3 border-t border-neutral-100">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs"
                            onClick={() => openGenerateModal(template)}
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Generar
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => previewTemplate(template)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditor(template)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => duplicateTemplate(template)}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-danger-50"
                            onClick={() => deleteTemplate(template._id, template.name)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-danger-400" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          /* History View */
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {generated.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="text-center py-16">
                  <Calendar className="w-14 h-14 mx-auto mb-4 text-neutral-200" />
                  <h3 className="text-lg font-semibold text-neutral-700">No hay cartas generadas</h3>
                  <p className="text-neutral-500 mt-1">
                    Genera tu primera carta desde una plantilla
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                  <div className="divide-y divide-neutral-100">
                    {generated.map((letter, i) => (
                      <motion.div
                        key={letter._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-primary-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-900 truncate">
                              {letter.templateName}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-neutral-500">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {letter.personName || letter.recipientName || 'Destinatario'}
                              </span>
                              <span>
                                {new Date(letter.createdAt).toLocaleDateString('es-DO', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => previewGeneratedLetter(letter)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Modal */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
            </DialogTitle>
            <DialogDescription>
              Usa variables entre llaves dobles para personalizar. Ej: {'{{nombre}}'}, {'{{fecha}}'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="Ej: Carta de Bienvenida"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <select
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                  className="w-full h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick insert variables */}
            <div className="space-y-2">
              <Label className="text-xs text-neutral-500">Variables disponibles (click para insertar)</Label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => insertVariable(v.key)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors font-mono border border-primary-100"
                    title={v.desc}
                  >
                    {`{{${v.key}}}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Contenido *</Label>
              <textarea
                value={templateForm.content}
                onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                placeholder={`Estimado/a {{nombre}},\n\nPor medio de la presente, nos es grato comunicarle que...\n\nAtentamente,\n{{pastor}}\n{{iglesia}}`}
                className="w-full min-h-[300px] rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y font-mono leading-relaxed"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditor(false)}>
              Cancelar
            </Button>
            <Button onClick={saveTemplate} disabled={savingTemplate}>
              {savingTemplate ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {editingTemplate ? 'Guardar Cambios' : 'Crear Plantilla'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar Carta</DialogTitle>
            <DialogDescription>
              Selecciona la persona para generar una carta con la plantilla "{generateTemplate?.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Persona Destinataria *</Label>
              <select
                value={generatePersonId}
                onChange={(e) => setGeneratePersonId(e.target.value)}
                className="w-full h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Seleccionar persona...</option>
                {persons.map((p: any) => (
                  <option key={p._id} value={p._id}>
                    {p.fullName} {p.ministry ? `(${p.ministry})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {generateTemplate?.variables && generateTemplate.variables.length > 0 && (
              <div className="rounded-lg bg-neutral-50 p-3">
                <p className="text-xs font-medium text-neutral-600 mb-2">Variables que se reemplazarán:</p>
                <div className="flex flex-wrap gap-1">
                  {generateTemplate.variables.map((v) => (
                    <span key={v} className="text-[10px] px-2 py-0.5 rounded bg-white border border-neutral-200 font-mono">
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateModal(false)}>
              Cancelar
            </Button>
            <Button onClick={generateLetter} disabled={generating || !generatePersonId}>
              {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Generar Carta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTitle}</DialogTitle>
            <DialogDescription>Vista previa del contenido</DialogDescription>
          </DialogHeader>
          <div className="bg-white border border-neutral-200 rounded-lg p-8 min-h-[200px] font-serif text-neutral-800 leading-relaxed whitespace-pre-wrap">
            {previewContent}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

export default LetterTemplatesPage
