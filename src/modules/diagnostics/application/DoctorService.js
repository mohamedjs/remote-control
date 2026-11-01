export class DoctorService {
  #port;

  /**
   * @param {import('../domain/DiagnosticPort.js').DiagnosticPort} port
   */
  constructor(port) {
    this.#port = port;
  }

  async runDoctor() {
    const items = await this.#port.runChecks();
    let hasFailures = false;

    console.log('\n🔍 Remote Control System Doctor\n');
    for (const item of items) {
      const badge = item.status === 'pass'
        ? '\x1b[32m[PASS]\x1b[0m'
        : item.status === 'warn'
        ? '\x1b[33m[WARN]\x1b[0m'
        : '\x1b[31m[FAIL]\x1b[0m';

      console.log(` ${badge} ${item.name}: ${item.message}`);
      if (item.fix && item.status !== 'pass') {
        console.log(`        \x1b[36mFix:\x1b[0m ${item.fix}`);
      }
      if (item.status === 'fail') hasFailures = true;
    }

    console.log('');
    return { ok: !hasFailures, items };
  }
}
