# 📚 CompuMundo CEDIS

Sistema de Gestión para el **Centro de Documentación (CEDIS)** desarrollado como proyecto académico para la  
**Escuela Profesional de Ingeniería de Sistemas – Universidad Nacional de San Agustín (UNSA)**.

---

## 🧩 Descripción General

**CompuMundo CEDIS** es una plataforma web que centraliza y automatiza la gestión bibliográfica del centro de documentación, reemplazando procesos manuales basados en cuadernos y hojas de cálculo, reduciendo errores, mejorando la trazabilidad de la información y optimizando los tiempos de atención.

El sistema permite administrar préstamos, usuarios, lectores y material bibliográfico, además de generar reportes y métricas clave para la toma de decisiones.

---

## 👥 Roles del Sistema

El sistema implementa control de accesos basado en roles (**RBAC**):

- **Administrador**
  - Gestión de usuarios del sistema
  - Configuración general
  - Acceso total a módulos y reportes

- **Bibliotecario**
  - Gestión de préstamos
  - Gestión de lectores
  - Administración del material bibliográfico

- **Consultor / Cliente**
  - Consulta de material disponible
  - Visualización del estado de préstamos

---

## 🏗️ Arquitectura del Proyecto

El proyecto sigue una arquitectura **Full Stack desacoplada**, basada en buenas prácticas de ingeniería de software:

- **Backend**
  - API REST desarrollada con **NestJS**
  - Patrón **Controlador – Servicio – Repositorio**
  - Documentación automática con **Swagger / OpenAPI**

- **Frontend**
  - Aplicación **SPA** desarrollada con **React + Vite**
  - Enrutamiento con React Router
  - Manejo de estado mediante Context API

- **Persistencia**
  - Base de datos relacional **PostgreSQL**
  - Acceso a datos mediante **Prisma ORM**

---

## 🚀 Stack Tecnológico

### Backend
- NestJS (TypeScript)
- Prisma ORM
- PostgreSQL
- JWT + Passport
- Swagger (OpenAPI)

### Frontend
- React 19
- Vite
- TypeScript
- React Router DOM
- Chart.js

### DevOps y Despliegue
- **Frontend:** Vercel  
- **Backend:** Railway  
- **Base de datos:** PostgreSQL (Railway)  
- **CI/CD:** Integración continua desde la rama `main`

---

## ✨ Funcionalidades Principales

- 📖 Gestión de préstamos con validaciones automáticas
- 👤 Gestión de lectores (estudiantes, docentes y administrativos)
- 📚 Gestión de material bibliográfico físico y virtual
- 🧾 Control de stock y disponibilidad
- 📊 Dashboard con estadísticas en tiempo real
- 📑 Generación y exportación de reportes en **PDF** y **Excel**
- 🔐 Autenticación segura con **JWT**
- 🛡️ Protección de rutas según rol de usuario

---

## 📌 Reglas de Negocio Implementadas

- Préstamos con duración máxima de **3 días hábiles**
- Bloqueo automático de nuevos préstamos ante morosidad activa
- Validación estricta de stock físico disponible
- Eliminación lógica (**Soft Delete**) para mantener historial
- Expiración automática de sesión por inactividad
- Validación de DNI y correos únicos en todo el sistema

---

## 🚀 Despliegue

El sistema se encuentra desplegado en la nube utilizando servicios modernos de hosting:

- **Frontend:** Vercel  
- **Backend:** Railway  
- **Base de Datos:** PostgreSQL (Railway)

🔗 **Demo en producción:**  
https://compu-mundo-cedis.vercel.app/login

---

## 🎓 Contexto Universitario

Este proyecto fue desarrollado con fines académicos como parte del curso:

- **Universidad:** Universidad Nacional de San Agustín (UNSA)
- **Escuela Profesional:** Ingeniería de Sistemas
- **Curso:** Construcción de Software
- **Periodo Académico:** 2025

El sistema aplica conceptos de arquitectura de software, patrones de diseño, seguridad, control de accesos y despliegue en la nube.

---

## ✍️ Autores

- **Choquehuanca Zapana, Hernan Andy**
- **Maldonado Vilca, Victor Gonzalo**
- **Mamani Anahua, Victor Narciso**
- **Quispe Marca, Edysson Darwin**

Estudiantes de la Escuela Profesional de Ingeniería de Sistemas –  
**Universidad Nacional de San Agustín (UNSA)**.

---

## 📌 Estado del Proyecto

✅ Funcional – en constante mejora y expansión

