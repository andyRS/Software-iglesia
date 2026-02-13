import { useState, useEffect } from 'react'
import { churchesApi, rolesApi } from '../lib/api'
import { toast } from 'sonner'
import { Loader2, Save, Plus, Trash2, Settings } from 'lucide-react'
import { motion } from 'framer-motion'

import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

const SettingsPage = () => {
  const [church, setChurch] = useState<any>(null)
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [roleForm, setRoleForm] = useState({ name: '', description: '', color: '#3B82F6', requiresSkill: false })
  const [savingRole, setSavingRole] = useState(false)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [cRes, rRes] = await Promise.all([churchesApi.getMine(), rolesApi.getAll()])
      setChurch(cRes.data.data)
      setRoles(rRes.data.data)
    } catch {}
    setLoading(false)
  }

  const saveChurch = async () => {
    setSaving(true)
    try {
      await churchesApi.updateMine(church)
      toast.success('Iglesia actualizada')
    } catch {
      toast.error('Error al guardar')
    }
    setSaving(false)
  }

  const addRole = async () => {
    if (!roleForm.name.trim()) return toast.error('Nombre requerido')
    setSavingRole(true)
    try {
      await rolesApi.create(roleForm)
      toast.success('Rol creado')
      setShowRoleModal(false)
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error')
    }
    setSavingRole(false)
  }

  const deleteRole = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar rol "${name}"?`)) return
    try {
      await rolesApi.delete(id)
      toast.success('Eliminado')
      load()
    } catch {
      toast.error('Error')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Configuración</h1>
        <p className="text-neutral-600 mt-1">
          Administra la información de tu iglesia y los roles disponibles
        </p>
      </div>

      {/* Church Info */}
      {church && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información de la Iglesia</CardTitle>
              <CardDescription>Datos generales de tu congregación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="churchName">Nombre</Label>
                <Input
                  id="churchName"
                  value={church.name}
                  onChange={(e) => setChurch({ ...church, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Logo de la Iglesia</Label>
                <div className="flex items-center gap-4">
                  {church.logoUrl && (
                    <img
                      src={church.logoUrl}
                      alt="Logo"
                      className="w-16 h-16 object-contain border border-neutral-200 rounded-lg"
                    />
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    className="flex-1"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      try {
                        const res = await churchesApi.uploadLogo(file)
                        setChurch(res.data.data)
                        toast.success('Logo actualizado')
                      } catch {
                        toast.error('Error al subir logo')
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="churchAddress">Dirección</Label>
                <Input
                  id="churchAddress"
                  value={church.address?.street || ''}
                  onChange={(e) => setChurch({ ...church, address: { ...church.address, street: e.target.value } })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="churchCity">Ciudad</Label>
                  <Input
                    id="churchCity"
                    value={church.address?.city || ''}
                    onChange={(e) => setChurch({ ...church, address: { ...church.address, city: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="churchPhone">Teléfono</Label>
                  <Input
                    id="churchPhone"
                    value={church.phone || ''}
                    onChange={(e) => setChurch({ ...church, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rotationWeeks">Semanas de Rotación</Label>
                <Input
                  id="rotationWeeks"
                  type="number"
                  min="2"
                  max="12"
                  value={church.settings?.rotationWeeks || 4}
                  onChange={(e) => setChurch({ ...church, settings: { ...church.settings, rotationWeeks: Number(e.target.value) } })}
                  className="w-32"
                />
              </div>

              <Button onClick={saveChurch} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Guardar
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Roles */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Roles Disponibles</CardTitle>
                <CardDescription>
                  Roles que se pueden asignar a las personas
                  {roles.length > 0 && ` (${roles.length})`}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRoleForm({ name: '', description: '', color: '#3B82F6', requiresSkill: false })
                  setShowRoleModal(true)
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Nuevo Rol
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {roles.length === 0 ? (
              <div className="text-center py-8">
                <Settings className="w-10 h-10 mx-auto mb-3 text-neutral-300" />
                <p className="text-neutral-500 text-sm">No hay roles configurados</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-primary-600"
                  onClick={() => {
                    setRoleForm({ name: '', description: '', color: '#3B82F6', requiresSkill: false })
                    setShowRoleModal(true)
                  }}
                >
                  Crear primer rol
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {roles.map((r) => (
                  <div
                    key={r._id}
                    className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200 rounded-lg hover:bg-neutral-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full border border-neutral-200"
                        style={{ backgroundColor: r.color }}
                      />
                      <div>
                        <p className="font-medium text-sm text-neutral-900">{r.name}</p>
                        {r.description && (
                          <p className="text-xs text-neutral-500">{r.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.requiresSkill && (
                        <Badge variant="secondary" className="text-xs">
                          Requiere habilidad
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteRole(r._id, r.name)}
                        className="h-8 w-8 p-0 text-neutral-400 hover:text-danger-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Role Modal */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Rol</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Nombre *</Label>
              <Input
                id="roleName"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                placeholder="Ej: Adoración"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roleDesc">Descripción</Label>
              <Input
                id="roleDesc"
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                placeholder="Breve descripción del rol"
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="space-y-2">
                <Label htmlFor="roleColor">Color</Label>
                <Input
                  id="roleColor"
                  type="color"
                  value={roleForm.color}
                  onChange={(e) => setRoleForm({ ...roleForm, color: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer mt-6">
                <input
                  type="checkbox"
                  checked={roleForm.requiresSkill}
                  onChange={(e) => setRoleForm({ ...roleForm, requiresSkill: e.target.checked })}
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">Requiere habilidad especial</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleModal(false)}>
              Cancelar
            </Button>
            <Button onClick={addRole} disabled={savingRole}>
              {savingRole && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

export default SettingsPage
