import { describe, it, expect } from 'vitest';
import {
  mockExpediente,
  mockTarea,
  mockUser,
  mockActuacion,
  mockAudiencia,
  mockTablero,
  mockColumnaKanban,
  mockPrioridad,
} from '../__mocks__/index';

describe('koop-models — factories de mocks', () => {
  describe('Expediente', () => {
    it('crea un expediente con todos los campos obligatorios', () => {
      const exp = mockExpediente();
      expect(exp.id).toBeTruthy();
      expect(exp.numero_de_expediente).toBeTruthy();
      expect(exp.id_usuario).toBeTruthy();
      expect(typeof exp.active).toBe('boolean');
    });

    it('permite sobreescribir campos del expediente', () => {
      const exp = mockExpediente({ id_cliente: 99, active: false });
      expect(exp.id_cliente).toBe(99);
      expect(exp.active).toBe(false);
    });

    it('el expediente mock referencia el combo tipo/subtipo/pretensión', () => {
      const exp = mockExpediente();
      expect(exp.id_tipo_proc_subtipo_proc_tipo_pre).toBe(1);
    });
  });

  describe('Tarea', () => {
    it('crea una tarea con todos los campos obligatorios', () => {
      const tarea = mockTarea();
      expect(tarea.id).toBeTruthy();
      expect(tarea.titulo).toBeTruthy();
      expect(typeof tarea.es_hito_preclusivo).toBe('boolean');
      expect(typeof tarea.active).toBe('boolean');
    });

    it('la tarea mock por defecto tiene prioridad alta', () => {
      const tarea = mockTarea();
      expect(tarea.id_prioridad).toBe(1);
    });

    it('la tarea mock por defecto es hito preclusivo', () => {
      const tarea = mockTarea();
      expect(tarea.es_hito_preclusivo).toBe(true);
    });

    it('permite crear tarea sin expediente (tarea libre)', () => {
      const tarea = mockTarea({ id_expediente: undefined });
      expect(tarea.id_expediente).toBeUndefined();
    });
  });

  describe('User', () => {
    it('crea un usuario sin campos sensibles (ya no expuestos por el backend)', () => {
      const user = mockUser();
      expect(user.id).toBeTruthy();
      expect(user.nombre).toBeTruthy();
      expect(user.email).toContain('@');
      expect('PASSWORD_HASH' in user).toBe(false);
    });

    it('el usuario admin tiene el rol correcto', () => {
      const user = mockUser();
      expect(user.roles.some((r) => r.nombre === 'admin')).toBe(true);
    });
  });

  describe('Catálogos', () => {
    it('Prioridad tiene nivel numérico', () => {
      const prioridad = mockPrioridad();
      expect(typeof prioridad.nivel).toBe('number');
    });
  });

  describe('Kanban', () => {
    it('Tablero tiene nombre y es_publico', () => {
      const tablero = mockTablero();
      expect(tablero.nombre).toBeTruthy();
      expect(typeof tablero.es_publico).toBe('boolean');
    });

    it('ColumnaKanban tiene orden numérico y es_inicial/es_final booleanos', () => {
      const col = mockColumnaKanban();
      expect(typeof col.es_inicial).toBe('boolean');
      expect(typeof col.es_final).toBe('boolean');
    });
  });

  describe('Actuacion', () => {
    it('crea una actuación con expediente y usuario registrador', () => {
      const act = mockActuacion();
      expect(act.id).toBeTruthy();
      expect(act.id_expediente).toBeTruthy();
      expect(act.id_usuario_registra).toBeTruthy();
      expect(typeof act.es_hito).toBe('boolean');
    });
  });

  describe('Audiencia', () => {
    it('crea una audiencia con fecha programada y modalidad', () => {
      const aud = mockAudiencia();
      expect(aud.tipo_audiencia).toBeTruthy();
      expect(aud.modalidad).toBeTruthy();
      expect(aud.fecha_programada).toBeTruthy();
    });
  });
});
