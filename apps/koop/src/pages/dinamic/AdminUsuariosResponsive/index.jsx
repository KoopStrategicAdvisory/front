import { useState, useCallback } from "react";
import { useUsers } from "../../../hooks/useUsers";
import "../../../styles/dashboard.css";
import { SuccessNotice, DangerNotice } from '../../../components/common/Notice';
import UsuariosPendientesActivar from './components/UsuariosPendientesActivar';
import UsuariosActivos from './components/UsuariosActivos';

export default function AdminUsuarios() {
  const {
    user,
    isAdmin,
    users,
    loading,
    error,
    updating,
    deleting,
    roleOptions,
    fetchUsers,
    updateUser,
    deleteUser,
    addRole,
    removeRole,
  } = useUsers();

  const [notice, setNotice] = useState(null);
  const [search, setSearch] = useState("");

  const currentUserId = user?.id;

  const toggleActive = useCallback(async (id, active) => {
    try {
      await updateUser(id, { active });
      setNotice(active ? 'Usuario activado' : 'Usuario desactivado');
    } catch (e) {
      setNotice(e?.message || 'No se pudo actualizar el usuario');
    }
  }, [updateUser]);

  const toggleRole = useCallback(async (id, roleId, hasRole) => {
    try {
      if (hasRole) await removeRole(id, roleId);
      else await addRole(id, roleId);
      setNotice('Roles actualizados');
    } catch (e) {
      setNotice(e?.message || 'No se pudo actualizar los roles');
    }
  }, [addRole, removeRole]);

  const removeUser = useCallback(async (id) => {
    if (!window.confirm('¿Deseas eliminar este usuario? Esta acción es permanente.')) return;
    try {
      await deleteUser(id);
      setNotice('Usuario eliminado');
    } catch (e) {
      setNotice(e?.message || 'No se pudo eliminar el usuario');
    }
  }, [deleteUser]);

  if (!isAdmin) {
    return (
      <div className="dash-page" style={{ padding: 40 }}>
        <div className="dash-card" style={{ maxWidth: 560 }}>
          <h2 className="dash-title">Acceso restringido</h2>
          <p style={{ marginTop: 12 }}>
            Esta seccion esta disponible solo para administradores.
          </p>
        </div>
      </div>
    );
  }

  const norm = (v) => String(v || "").toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const q = norm(search);
  const filtered = users.filter((u) => !q || [u.nombre, u.email].some((val) => norm(val).includes(q)));

  return (
    <div
      className="dash-page"
      style={{
        backgroundImage:
          "linear-gradient(rgba(13,27,42,0.65), rgba(27,38,59,0.65)), url('/fondodashboard.jpg')",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        backgroundPosition: "center",
        paddingLeft: 16,
        paddingRight: 16,
        paddingBottom: 16,
      }}
    >
      <div className="dash-card" style={{ width: "100%", maxWidth: 1200 }}>
        <div className="dash-header" style={{ marginBottom: 16, gap: 12 }}>
          <div className="dash-title">Administrar usuarios</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              className="input"
              placeholder="Buscar por nombre o correo"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 260 }}
            />
            {search && (
              <button className="btn btn-secondary btn-sm" onClick={() => setSearch("")}>Limpiar</button>
            )}
            <button className="btn btn-secondary" onClick={fetchUsers} disabled={loading}>
              {loading ? "Actualizando..." : "Refrescar"}
            </button>
          </div>
        </div>
        {notice && (<SuccessNotice autoHideMs={3500} onClose={() => setNotice(null)}>{notice}</SuccessNotice>)}
        {error && (<DangerNotice>{error}</DangerNotice>)}

        <UsuariosPendientesActivar
          users={filtered}
          loading={loading}
          currentUserId={currentUserId}
          updating={updating}
          deleting={deleting}
          roleOptions={roleOptions}
          onToggleActive={toggleActive}
          onToggleRole={toggleRole}
          onRemoveUser={removeUser}
        />

        <UsuariosActivos
          users={filtered}
          loading={loading}
          currentUserId={currentUserId}
          updating={updating}
          deleting={deleting}
          roleOptions={roleOptions}
          onToggleActive={toggleActive}
          onToggleRole={toggleRole}
          onRemoveUser={removeUser}
        />
      </div>
    </div>
  );
}
