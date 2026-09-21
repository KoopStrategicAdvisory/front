// Atajos que hablan directo con el backend aislado de pruebas (puerto 4100)
// para preparar datos sin recorrer la interfaz — así cada prueba solo
// verifica la pantalla que le toca, no todo lo que hay antes.
export const API = 'http://localhost:4100/api';

export async function tokenDe(request, { email, password }) {
  const res = await request.post(`${API}/auth/login`, { data: { email, password } });
  if (!res.ok()) throw new Error(`Login por API falló: ${res.status()}`);
  return (await res.json()).accessToken;
}

async function post(request, token, ruta, data) {
  const res = await request.post(`${API}${ruta}`, { data, headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok()) throw new Error(`POST ${ruta} falló (${res.status()}): ${await res.text()}`);
  return res.json();
}

// Crea un cliente con un expediente que ya tiene radicado del despacho, que es
// lo que hace falta para poder agregarlo a la lista diaria de consultas.
export async function crearClienteConExpediente(request, token, { nombre, expediente, radicado }) {
  const cliente = await post(request, token, '/clientes', { nombre });
  const exp = await post(request, token, '/expedientes', {
    numero_de_expediente: expediente,
    numero_radicado_despacho: radicado,
    id_cliente: cliente.id,
    id_tipo_proc_subtipo_proc_tipo_pre: 1,
    contraparte: 'Contraparte de prueba',
    correo_juzgado: 'juzgado@prueba.test',
  });
  return { cliente, expediente: exp };
}

// Deja un expediente ya agregado a la lista diaria (lo que el asistente
// "Agregar proceso" hace por la interfaz).
export async function agregarASeguimiento(request, token, { idExpediente, organismo, modalidad = 'manual' }) {
  return post(request, token, '/consultas-externas/seguimientos', {
    id_expediente: idExpediente, organismo, modalidad,
  });
}

// Retira TODOS los procesos de la lista diaria, para pruebas que necesitan
// partir de una lista conocida (las demás pruebas dejan procesos suyos).
export async function vaciarListaDiaria(request, token) {
  const headers = { Authorization: `Bearer ${token}` };
  const lista = await (await request.get(`${API}/consultas-externas/radicados`, { headers })).json();
  for (const item of lista.items) {
    const res = await request.put(`${API}/consultas-externas/radicados/${item.id_radicado_publico}/seguimiento`, {
      data: { modalidad: null }, headers,
    });
    if (!res.ok()) throw new Error(`No se pudo retirar ${item.id_radicado_publico}: ${res.status()}`);
  }
}

export async function crearCliente(request, token, datos) {
  return post(request, token, '/clientes', datos);
}

// Sube un documento por la API al S3 falso del servidor de pruebas.
export async function subirDocumento(request, token, { idExpediente, nombre, contenido, mime = 'text/plain' }) {
  const res = await request.post(`${API}/documentos`, {
    headers: { Authorization: `Bearer ${token}` },
    multipart: {
      id_expediente: String(idExpediente),
      id_tipo_documento: '1',
      file: { name: nombre, mimeType: mime, buffer: Buffer.from(contenido) },
    },
  });
  if (!res.ok()) throw new Error(`Subir documento falló (${res.status()}): ${await res.text()}`);
  return res.json();
}
