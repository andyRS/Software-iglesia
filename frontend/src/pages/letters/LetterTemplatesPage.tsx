import { FileText, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { EmptyState } from '../../components/ui/empty-state'

const LetterTemplatesPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Plantillas de Cartas</h1>
          <p className="text-neutral-600 mt-1">
            Gestiona plantillas para cartas e invitaciones
          </p>
        </div>
        <Button size="lg" disabled>
          <Plus className="w-5 h-5 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-0">
          <EmptyState
            icon={FileText}
            title="Disponible próximamente"
            description="Podrás crear plantillas y generar cartas personalizadas para los miembros de tu iglesia."
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default LetterTemplatesPage
