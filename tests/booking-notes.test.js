import test from "node:test";
import assert from "node:assert/strict";
import { onRequestGet, onRequestPost } from "../functions/api/booking-notes.js";

const TOKEN = "test-admin-token";
function makeDb({ bookingExists = true } = {}) {
  const notes = [];
  const db = {
    notes,
    prepare(sql) {
      return {
        values: [],
        bind(...values) { this.values = values; return this; },
        async first() {
          if (sql.includes("FROM admin_bookings")) {
            return bookingExists ? { id: this.values[0] } : null;
          }
          return null;
        },
        async all() {
          return { results: notes.filter(n => n.booking_id === this.values[0]).reverse() };
        },
        async run() {
          if (sql.includes("INSERT INTO booking_admin_notes")) {
            const [id, booking_id, actor_label, note, created_at] = this.values;
            notes.push({ id, booking_id, actor_label, note, created_at });
          }
          return { success: true };
        }
      };
    }
  };
  return db;
}
function request(path, { method = "GET", body, token = TOKEN } = {}) {
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (body !== undefined) headers.set("Content-Type", "application/json");
  return new Request(`https://example.test${path}`, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body)
  });
}
const env = db => ({ SEAT_LOCKS_DB: db, FIGHTS_ADMIN_TOKEN: TOKEN });

test("rejects requests without admin authorization", async () => {
  const response = await onRequestGet({
    request: request("/api/booking-notes?bookingId=b-1", { token: null }),
    env: env(makeDb())
  });
  assert.equal(response.status, 401);
});

test("rejects empty and oversized notes", async () => {
  const db = makeDb();
  for (const note of ["", "x".repeat(2001)]) {
    const response = await onRequestPost({
      request: request("/api/booking-notes", {
        method: "POST", body: { bookingId: "b-1", note }
      }),
      env: env(db)
    });
    assert.equal(response.status, 400);
  }
});

test("does not add a note for an unknown Booking ID", async () => {
  const db = makeDb({ bookingExists: false });
  const response = await onRequestPost({
    request: request("/api/booking-notes", {
      method: "POST", body: { bookingId: "missing", note: "Internal follow-up" }
    }),
    env: env(db)
  });
  assert.equal(response.status, 404);
  assert.equal(db.notes.length, 0);
});

test("stores and returns notes linked to an existing Booking ID", async () => {
  const db = makeDb();
  const post = await onRequestPost({
    request: request("/api/booking-notes", {
      method: "POST",
      body: { bookingId: "booking-123", note: "Please review the record", actorLabel: "forged-name" }
    }),
    env: env(db)
  });
  assert.equal(post.status, 201);
  const created = await post.json();
  assert.equal(created.note.booking_id, "booking-123");
  assert.equal(created.note.actor_label, "admin");

  const get = await onRequestGet({
    request: request("/api/booking-notes?bookingId=booking-123"),
    env: env(db)
  });
  assert.equal(get.status, 200);
  const listed = await get.json();
  assert.equal(listed.notes.length, 1);
  assert.equal(listed.notes[0].note, "Please review the record");
});
