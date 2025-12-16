# 🎨 Frontend – CompuMundo CEDIS

Aplicación web del sistema **CompuMundo CEDIS**, encargada de la interfaz de usuario, navegación, autenticación y consumo de la API REST del backend.

Desarrollada como **SPA (Single Page Application)** usando **React + Vite + TypeScript**.

---

## 🧩 Descripción

El frontend proporciona una interfaz moderna, rápida y segura para la gestión del Centro de Documentación (CEDIS). 

Implementa autenticación con JWT, protección de rutas, control de sesiones y visualización de métricas y reportes.

La aplicación está diseñada para usuarios autenticados con diferentes roles, centralizando toda la navegación bajo una única ruta protegida.

---

## 🏗️ Arquitectura Frontend

* **SPA** con React
* **Routing** con React Router DOM
* **Context API** para autenticación y sesión
* **Layouts** para estructura administrativa
* **Servicios centralizados** para consumo de API
* **Protección de rutas** mediante `PrivateRoute`

---

## 🔐 Autenticación y Seguridad

La autenticación se gestiona mediante **JWT**:

- El token se almacena en `localStorage`
- Se valida la expiración del token (`exp`)
- Logout automático cuando el token expira
- Redirección automática a `/login` ante error **401**
- Protección de rutas mediante `PrivateRoute`

### AuthContext

El estado global de autenticación se maneja con **Context API**, exponiendo:

- Usuario autenticado
- Token JWT
- Funciones de login / logout
- Función `authFetch` para requests protegidos
- Validación automática de sesión

---

## 🌐 Comunicación con el Backend

Las peticiones HTTP se realizan mediante `fetch` usando una función centralizada:

- Inyección automática del token JWT
- Configuración de headers (`Authorization`, `Content-Type`)
- Control del error **401** para cierre de sesión
- Uso de una URL base configurable por entorno

---

## 📊 Visualización y Reportes

- Dashboard con métricas estadísticas
- Gráficos implementados con **Chart.js**
- Reportes exportables (**PDF** y **Excel**) generados desde el backend
- Visualización de información en tiempo real

---

## 🚀 Despliegue

- **Frontend:** Vercel
- **Integración continua:** rama `main`
- **Variables de entorno:** gestionadas desde el panel de Vercel

🔗 **Demo en producción:**  
https://compu-mundo-cedis.vercel.app/login

---

## 🎓 Contexto Académico

- **Universidad:** Universidad Nacional de San Agustín (UNSA)
- **Carrera:** Ingeniería de Sistemas
- **Curso:** Construcción de Software
- **Periodo:** 2025

---

## ✍️ Autores

- Choquehuanca Zapana, Hernan Andy
- Maldonado Vilca, Victor Gonzalo
- Mamani Anahua, Victor Narciso
- Quispe Marca, Edysson Darwin

---

## 📌 Estado

✅ Frontend funcional, seguro y listo para producción

