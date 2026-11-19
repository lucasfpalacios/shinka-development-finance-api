import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

// Tests contra un Postgres real: `docker compose up -d db-test` antes de correrlos.
// Las variables de conexión las pone test/setup-e2e.ts.

const BOT_KEY = 'test-bot-api-key-de-24-caracteres-o-mas';

interface AuthBody {
  access_token: string;
  user: { id: string; email: string; name: string };
}

describe('Katana Finance API (e2e)', () => {
  let app: INestApplication<App>;
  let http: ReturnType<typeof request>;
  let tokenA: string;
  let tokenB: string;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    // Base limpia en cada corrida: borra y recrea todas las tablas
    await app.get(DataSource).synchronize(true);
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health', async () => {
    await http.get('/health').expect(200, { status: 'ok' });
  });

  describe('auth', () => {
    it('signup crea el usuario y devuelve token (email normalizado, sin password)', async () => {
      const res = await http
        .post('/auth/signup')
        .send({ name: 'Ana', email: '  ANA@Mail.com ', password: 'secreta123' })
        .expect(201);
      const body = res.body as AuthBody;
      expect(body.access_token).toEqual(expect.any(String));
      expect(body.user).toMatchObject({ name: 'Ana', email: 'ana@mail.com' });
      expect(JSON.stringify(body)).not.toContain('password');
      tokenA = body.access_token;

      const resB = await http
        .post('/auth/signup')
        .send({ name: 'Beto', email: 'beto@mail.com', password: 'secreta123' })
        .expect(201);
      tokenB = (resB.body as AuthBody).access_token;
    });

    it('signup rechaza email duplicado', async () => {
      await http
        .post('/auth/signup')
        .send({ name: 'Otra', email: 'ana@mail.com', password: 'secreta123' })
        .expect(409);
    });

    it('signup valida el body', async () => {
      await http
        .post('/auth/signup')
        .send({ name: 'X', email: 'no-es-email', password: 'corta' })
        .expect(400);
      // campos de más → 400 (forbidNonWhitelisted)
      await http
        .post('/auth/signup')
        .send({
          name: 'X',
          email: 'x@mail.com',
          password: 'secreta123',
          isAdmin: true,
        })
        .expect(400);
    });

    it('login correcto e incorrecto', async () => {
      await http
        .post('/auth/login')
        .send({ email: 'ANA@mail.com', password: 'secreta123' })
        .expect(200);
      await http
        .post('/auth/login')
        .send({ email: 'ana@mail.com', password: 'incorrecta' })
        .expect(401);
      await http
        .post('/auth/login')
        .send({ email: 'nadie@mail.com', password: 'secreta123' })
        .expect(401);
    });

    it('rutas protegidas sin token o con token inválido → 401', async () => {
      await http.get('/users/me').expect(401);
      await http.get('/users/me').set(auth('token-falso')).expect(401);
    });

    it('Google sin configurar → 503', async () => {
      await http.get('/auth/google').expect(503);
    });
  });

  describe('users', () => {
    it('GET /users/me no expone password ni código de vinculación', async () => {
      const res = await http.get('/users/me').set(auth(tokenA)).expect(200);
      expect(res.body).toMatchObject({
        name: 'Ana',
        email: 'ana@mail.com',
        currency: 'ARS',
      });
      expect(res.body).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('linkCode');
    });

    it('PATCH /users/me actualiza y valida', async () => {
      const res = await http
        .patch('/users/me')
        .set(auth(tokenA))
        .send({ name: 'Ana María', currency: 'USD' })
        .expect(200);
      expect(res.body).toMatchObject({ name: 'Ana María', currency: 'USD' });
      await http
        .patch('/users/me')
        .set(auth(tokenA))
        .send({ currency: 'BTC' })
        .expect(400);
      // no se puede setear el WhatsApp a mano (hay que usar el código)
      await http
        .patch('/users/me')
        .set(auth(tokenA))
        .send({ whatsappNumber: '5491100000000' })
        .expect(400);
    });
  });

  describe('transactions', () => {
    let txId: string;

    it('crea transacciones', async () => {
      const res = await http
        .post('/transactions')
        .set(auth(tokenA))
        .send({
          type: 'expense',
          amount: 1500.5,
          category: 'comida',
          date: '2026-03-10',
        })
        .expect(201);
      expect(res.body).toMatchObject({
        amount: 1500.5,
        source: 'dashboard',
        date: '2026-03-10',
      });
      txId = (res.body as { id: string }).id;

      await http
        .post('/transactions')
        .set(auth(tokenA))
        .send({
          type: 'income',
          amount: 100000,
          category: 'sueldo',
          date: '2026-03-01',
        })
        .expect(201);
      await http
        .post('/transactions')
        .set(auth(tokenA))
        .send({
          type: 'expense',
          amount: 499.5,
          category: 'comida',
          description: 'café 100%',
          date: '2026-03-15',
        })
        .expect(201);
      // otro mes: no debería entrar en el resumen de marzo
      await http
        .post('/transactions')
        .set(auth(tokenA))
        .send({
          type: 'expense',
          amount: 999,
          category: 'comida',
          date: '2026-04-01',
        })
        .expect(201);
    });

    it('valida el body', async () => {
      const bad = [
        { type: 'gasto', amount: 10, category: 'x' },
        { type: 'expense', amount: -5, category: 'x' },
        { type: 'expense', amount: 10.123, category: 'x' },
        { type: 'expense', amount: 10, category: '' },
        { type: 'expense', amount: 10, category: 'x', date: '10/03/2026' },
        { type: 'expense', amount: 10, category: 'x', userId: 'otro' },
      ];
      for (const body of bad) {
        await http
          .post('/transactions')
          .set(auth(tokenA))
          .send(body)
          .expect(400);
      }
    });

    it('lista con filtros y paginación', async () => {
      const all = await http.get('/transactions').set(auth(tokenA)).expect(200);
      expect(all.body).toMatchObject({ total: 4 });

      const march = await http
        .get('/transactions?from=2026-03-01&to=2026-03-31&type=expense')
        .set(auth(tokenA))
        .expect(200);
      expect((march.body as { total: number }).total).toBe(2);

      // el % se busca literal, no como comodín
      const search = await http
        .get('/transactions?search=100%25')
        .set(auth(tokenA))
        .expect(200);
      expect((search.body as { total: number }).total).toBe(1);

      const page = await http
        .get('/transactions?limit=1&offset=1')
        .set(auth(tokenA))
        .expect(200);
      expect((page.body as { items: unknown[] }).items).toHaveLength(1);

      const fromDashboard = await http
        .get('/transactions?source=dashboard')
        .set(auth(tokenA))
        .expect(200);
      expect((fromDashboard.body as { total: number }).total).toBe(4);
      await http.get('/transactions?source=sms').set(auth(tokenA)).expect(400);

      await http.get('/transactions?limit=1000').set(auth(tokenA)).expect(400);
    });

    it('resumen del mes', async () => {
      const res = await http
        .get('/transactions/summary?month=2026-03')
        .set(auth(tokenA))
        .expect(200);
      expect(res.body).toEqual({
        month: '2026-03',
        income: 100000,
        expense: 2000,
        balance: 98000,
        expensesByCategory: [{ category: 'comida', total: 2000 }],
      });
      await http
        .get('/transactions/summary?month=2026-13')
        .set(auth(tokenA))
        .expect(400);
    });

    it('un usuario no puede ver ni tocar transacciones de otro', async () => {
      await http.get(`/transactions/${txId}`).set(auth(tokenB)).expect(404);
      await http
        .patch(`/transactions/${txId}`)
        .set(auth(tokenB))
        .send({ amount: 1 })
        .expect(404);
      await http.delete(`/transactions/${txId}`).set(auth(tokenB)).expect(404);
      const list = await http
        .get('/transactions')
        .set(auth(tokenB))
        .expect(200);
      expect(list.body).toEqual({ items: [], total: 0 });
    });

    it('actualiza, borra e id inválido', async () => {
      const res = await http
        .patch(`/transactions/${txId}`)
        .set(auth(tokenA))
        .send({ amount: 1600 })
        .expect(200);
      expect(res.body).toMatchObject({ amount: 1600, category: 'comida' });
      await http.delete(`/transactions/${txId}`).set(auth(tokenA)).expect(204);
      await http.get(`/transactions/${txId}`).set(auth(tokenA)).expect(404);
      await http.get('/transactions/no-es-uuid').set(auth(tokenA)).expect(400);
    });
  });

  describe('budgets', () => {
    it('crea, lista con lo gastado, evita duplicados, actualiza y borra', async () => {
      const created = await http
        .post('/budgets')
        .set(auth(tokenA))
        .send({ category: 'comida', limit: 5000, month: '2026-03' })
        .expect(201);
      const id = (created.body as { id: string }).id;

      await http
        .post('/budgets')
        .set(auth(tokenA))
        .send({ category: 'comida', limit: 1, month: '2026-03' })
        .expect(409);

      // queda 499.5 de comida en marzo (la de 1600 se borró)
      const list = await http
        .get('/budgets?month=2026-03')
        .set(auth(tokenA))
        .expect(200);
      expect(list.body).toEqual([
        expect.objectContaining({
          category: 'comida',
          limit: 5000,
          spent: 499.5,
          remaining: 4500.5,
        }),
      ]);

      // B no ve ni toca el presupuesto de A
      const listB = await http
        .get('/budgets?month=2026-03')
        .set(auth(tokenB))
        .expect(200);
      expect(listB.body).toEqual([]);
      await http
        .patch(`/budgets/${id}`)
        .set(auth(tokenB))
        .send({ limit: 1 })
        .expect(404);

      await http
        .patch(`/budgets/${id}`)
        .set(auth(tokenA))
        .send({ limit: 6000 })
        .expect(200);
      await http.delete(`/budgets/${id}`).set(auth(tokenA)).expect(204);
    });
  });

  describe('bot (n8n)', () => {
    const bot = (key = BOT_KEY) => ({ 'x-api-key': key });
    const sender = { platform: 'whatsapp', senderId: '5491123456789' };

    it('sin API key o con una incorrecta → 401', async () => {
      await http.post('/bot/transactions').send({}).expect(401);
      await http
        .post('/bot/transactions')
        .set(bot('x'.repeat(40)))
        .send({})
        .expect(401);
    });

    it('número no vinculado → 404', async () => {
      await http
        .post('/bot/transactions')
        .set(bot())
        .send({ ...sender, type: 'expense', amount: 100, category: 'taxi' })
        .expect(404);
    });

    it('vincula con código, registra gastos y devuelve resumen', async () => {
      await http
        .post('/bot/link')
        .set(bot())
        .send({ ...sender, code: '000000' })
        .expect(400);

      const codeRes = await http
        .post('/users/me/link-code')
        .set(auth(tokenA))
        .expect(201);
      const { code } = codeRes.body as { code: string };
      expect(code).toMatch(/^\d{6}$/);

      const linked = await http
        .post('/bot/link')
        .set(bot())
        .send({ ...sender, code })
        .expect(200);
      expect(linked.body).toMatchObject({ whatsappNumber: sender.senderId });

      // el código es de un solo uso
      await http
        .post('/bot/link')
        .set(bot())
        .send({ ...sender, code })
        .expect(400);

      // otro usuario no puede reclamar el mismo número
      const codeB = await http
        .post('/users/me/link-code')
        .set(auth(tokenB))
        .expect(201);
      await http
        .post('/bot/link')
        .set(bot())
        .send({ ...sender, code: (codeB.body as { code: string }).code })
        .expect(409);

      const tx = await http
        .post('/bot/transactions')
        .set(bot())
        .send({ ...sender, type: 'expense', amount: 2500, category: 'taxi' })
        .expect(201);
      expect(tx.body).toMatchObject({ source: 'whatsapp', amount: 2500 });

      const summary = await http
        .get(`/bot/summary?platform=whatsapp&senderId=${sender.senderId}`)
        .set(bot())
        .expect(200);
      expect(summary.body).toMatchObject({ expense: 2500 });
    });

    it('desvincular', async () => {
      const res = await http
        .delete('/users/me/link/whatsapp')
        .set(auth(tokenA))
        .expect(200);
      expect(res.body).toMatchObject({ whatsappNumber: null });
      await http.delete('/users/me/link/sms').set(auth(tokenA)).expect(400);
    });
  });
});
