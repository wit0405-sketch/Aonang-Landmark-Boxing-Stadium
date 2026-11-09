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

test("rejects missing, whitespace-only, and oversized Booking IDs on write", async () => {
  const db = makeDb();
  const invalidBodies = [
    { bookingId: "", note: "Internal note" },
    { bookingId: "   ", note: "Internal note" },
    { bookingId: "x".repeat(101), note: "Internal note" },
    { bookingId: "booking-1", note: "   " }
  ];

  for (const body of invalidBodies) {
    const response = await onRequestPost({
      request: request("/api/booking-notes", { method: "POST", body }),
      env: env(db)
    });
    assert.equal(response.status, 400);
  }
  assert.equal(db.notes.length, 0);
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

test("rejects malformed JSON without writing a note", async () => {
  const db = makeDb();
  const malformed = new Request("https://example.test/api/booking-notes", {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: "{not-json"
  });
  const response = await onRequestPost({ request: malformed, env: env(db) });
  assert.equal(response.status, 400);
  assert.equal(db.notes.length, 0);
});

test("rejects missing and oversized booking IDs on read", async () => {
  const db = makeDb();
  for (const path of [
    "/api/booking-notes",
    `/api/booking-notes?bookingId=${"x".repeat(101)}`
  ]) {
    const response = await onRequestGet({ request: request(path), env: env(db) });
    assert.equal(response.status, 400);
  }
});

test("returns service unavailable when the D1 binding is missing", async () => {
  const get = await onRequestGet({
    request: request("/api/booking-notes?bookingId=b-1"),
    env: { FIGHTS_ADMIN_TOKEN: TOKEN }
  });
  assert.equal(get.status, 503);

  const post = await onRequestPost({
    request: request("/api/booking-notes", {
      method: "POST", body: { bookingId: "b-1", note: "Internal note" }
    }),
    env: { FIGHTS_ADMIN_TOKEN: TOKEN }
  });
  assert.equal(post.status, 503);
});

test("keeps notes isolated between different Booking IDs", async () => {
  const db = makeDb();
  for (const [bookingId, note] of [
    ["booking-a", "Note for A"],
    ["booking-b", "Note for B"]
  ]) {
    const response = await onRequestPost({
      request: request("/api/booking-notes", {
        method: "POST", body: { bookingId, note }
      }),
      env: env(db)
    });
    assert.equal(response.status, 201);
  }

  const response = await onRequestGet({
    request: request("/api/booking-notes?bookingId=booking-a"),
    env: env(db)
  });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.notes.length, 1);
  assert.equal(result.notes[0].booking_id, "booking-a");
  assert.equal(result.notes[0].note, "Note for A");
});

test("does not expose database errors when note reads fail", async () => {
  const db = {
    prepare() {
      return {
        bind() { return this; },
        async all() { throw new Error("private database detail"); }
      };
    }
  };
  const response = await onRequestGet({
    request: request("/api/booking-notes?bookingId=b-1"),
    env: env(db)
  });
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.doesNotMatch(JSON.stringify(body), /private database detail/);
});

test("does not expose database errors when note writes fail", async () => {
  const db = {
    prepare(sql) {
      return {
        bind() { return this; },
        async first() {
          if (sql.includes("FROM admin_bookings")) return { id: "b-1" };
          return null;
        },
        async run() { throw new Error("private database detail"); }
      };
    }
  };
  const response = await onRequestPost({
    request: request("/api/booking-notes", {
      method: "POST", body: { bookingId: "b-1", note: "Internal follow-up" }
    }),
    env: env(db)
  });
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.doesNotMatch(JSON.stringify(body), /private database detail/);
});
