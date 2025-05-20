/** @jsx h */
import { h } from "preact";
import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  async POST(req) {
    const form = await req.formData();
    const name = form.get("name");
    const email = form.get("email");
    const phone = form.get("phone");

    await fetch("https://back-a-p4.onrender.com/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone }),
    });

    return Response.redirect("/main", 303);
  },
};

export default function CreateContactPage() {
  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", fontFamily: "Arial" }}>
      <h2>Crear Contacto</h2>
      <form method="POST">
        <div style={{ marginBottom: "10px" }}>
          <label>Nombre</label><br />
          <input type="text" name="name" required style={{ width: "100%", padding: "8px" }} />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Email</label><br />
          <input type="email" name="email" required style={{ width: "100%", padding: "8px" }} />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Teléfono</label><br />
          <input type="tel" name="phone" required style={{ width: "100%", padding: "8px" }} />
        </div>
        <button type="submit" style={{ padding: "10px", width: "100%" }}>Crear</button>
      </form>
    </div>
  );
}