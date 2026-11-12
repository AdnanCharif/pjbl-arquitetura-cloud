/**
 * Publicador de eventos de domínio (EDA).
 * Nesta versão apenas registra o evento; pode ser trocado por um broker
 * (SNS, Event Grid, Kafka...) sem alterar os casos de uso.
 */
export class ConsoleEventPublisher {
  async publish(eventName, payload) {
    console.log(JSON.stringify({ event: eventName, payload, at: new Date().toISOString() }));
  }
}
