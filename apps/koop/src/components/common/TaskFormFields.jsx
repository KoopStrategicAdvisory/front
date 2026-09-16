import { EditForm, EditRow, EditField, EditTextArea, EditSelect } from './EditFormKit';

// Formulario de tarea compartido — usado tanto en /admin/tareas (crear/editar
// desde la lista) como en el panel de detalle que se abre al hacer clic en una
// tarjeta de Kanban, para no mantener dos formularios distintos con los mismos
// campos.
export function TaskFormFields({ formData, setFormData, admins, estados, prioridades, expedientes, isEdit }) {
  const adminOptions = admins.map((admin) => ({ value: admin.id, label: admin.nombre || admin.email || 'Administrador' }));
  const prioOptions = prioridades.map((p) => ({ value: p.id, label: p.nombre }));
  const estadoOptions = estados.map((e) => ({ value: e.id, label: e.nombre }));
  const expedienteOptions = expedientes.map((e) => ({ value: e.id, label: `${e.numero_de_expediente}${e.nombre_cliente ? ` — ${e.nombre_cliente}` : ''}` }));

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <EditForm style={{ marginTop: 8 }}>
      <EditRow cols={2}>
        <EditField
          label="Título *"
          value={formData.title}
          onChange={handleChange('title')}
          inputProps={{ placeholder: 'Título de la tarea' }}
        />
        {/* Toda tarea pertenece a un expediente (id_expediente es NOT NULL en el backend) —
            no se puede reasignar despues de creada, asi que en edicion se muestra fijo. */}
        <EditSelect
          label="Expediente *"
          value={formData.expedienteId || ''}
          onChange={handleChange('expedienteId')}
          options={expedienteOptions}
          placeholder={expedientes.length ? 'Selecciona expediente' : 'Cargando...'}
          selectProps={{ disabled: isEdit || !expedientes.length }}
        />
      </EditRow>

      <EditField
        label="Cliente / Observaciones"
        value={formData.client}
        onChange={handleChange('client')}
        inputProps={{ placeholder: 'Notas adicionales (opcional)' }}
      />

      <EditTextArea
        label="Descripción"
        rows={4}
        value={formData.description}
        onChange={handleChange('description')}
        placeholder="Descripción detallada de la tarea"
      />

      <EditRow cols={2}>
        <EditSelect
          label="Prioridad"
          value={formData.priorityId || ''}
          onChange={handleChange('priorityId')}
          options={prioOptions}
          placeholder={prioOptions.length ? 'Selecciona prioridad' : 'Cargando...'}
        />
        <EditSelect
          label="Estado *"
          value={formData.estadoId || ''}
          onChange={handleChange('estadoId')}
          options={estadoOptions}
          placeholder={estadoOptions.length ? 'Selecciona estado' : 'Cargando...'}
        />
      </EditRow>

      <EditRow cols={2}>
        <EditField
          label="Fecha límite"
          type="date"
          value={formData.due || ''}
          onChange={handleChange('due')}
          inputProps={{ min: today }}
        />
        <EditSelect
          label="Asignar a"
          value={formData.assignee || ''}
          onChange={handleChange('assignee')}
          options={adminOptions}
          placeholder={admins.length ? 'Selecciona un usuario' : 'No hay usuarios disponibles'}
          selectProps={{ disabled: !admins.length }}
        />
      </EditRow>
    </EditForm>
  );
}
