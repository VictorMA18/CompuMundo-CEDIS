export function calcularFechaVencimiento(fechaInicio: Date, diasHabiles: number): Date {
  const fecha = new Date(fechaInicio);
  let diasAgregados = 0;

  while (diasAgregados < diasHabiles) {
    fecha.setDate(fecha.getDate() + 1);
    const diaSemana = fecha.getDay();
    // 0 = Domingo, 6 = Sábado. Si no es finde, cuenta como día hábil.
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasAgregados++;
    }
  }
  return fecha;
}