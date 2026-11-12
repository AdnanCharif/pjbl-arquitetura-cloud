/**
 * Adaptador da porta EventPublisher para o Upstash QStash (broker pub/sub
 * gerenciado com entrega por push via HTTP). Substitui o ConsoleEventPublisher
 * sem alterar nenhum caso de uso (ADR 7).
 *
 * O QStash recebe a mensagem e a entrega (POST) em EVENTS_DESTINATION_URL,
 * que é a Function "eventos" (Message Trigger) publicada na Vercel.
 */
export class QStashEventPublisher {
  #token;
  #baseUrl;
  #destination;
  #source;
  #fetch;

  constructor({ token, destination, baseUrl = 'https://qstash.upstash.io', source, fetchFn = globalThis.fetch }) {
    if (!token) throw new Error('QSTASH_TOKEN não configurado.');
    if (!destination) throw new Error('EVENTS_DESTINATION_URL não configurado.');
    this.#token = token;
    this.#baseUrl = baseUrl.replace(/\/$/, '');
    this.#destination = destination;
    this.#source = source;
    this.#fetch = fetchFn;
  }

  async publish(eventName, payload) {
    const body = { event: eventName, source: this.#source, payload, at: new Date().toISOString() };
    try {
      const res = await this.#fetch(`${this.#baseUrl}/v2/publish/${this.#destination}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.#token}`,
          'Content-Type': 'application/json',
          'Upstash-Retries': '3',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`QStash respondeu ${res.status}: ${await res.text()}`);
      console.log(JSON.stringify({ published: eventName, payload }));
    } catch (err) {
      // O estado já foi persistido antes da publicação (QS-04): uma falha no
      // broker é registrada, mas não desfaz nem bloqueia a operação.
      console.error(JSON.stringify({ publishFailed: eventName, error: err.message }));
    }
  }
}
