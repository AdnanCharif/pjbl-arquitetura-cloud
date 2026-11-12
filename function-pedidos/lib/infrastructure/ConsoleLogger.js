/** Logger estruturado: cada linha JSON aparece nos logs da Vercel. */
export class ConsoleLogger {
  info(data) {
    console.log(JSON.stringify({ ...data, registradoEm: new Date().toISOString() }));
  }
}
