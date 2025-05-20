/** @jsx h */
import { h } from "preact";
import { Handlers, PageProps } from "$fresh/server.ts";

interface Contact {
  id: string;
  name: string;
}

interface Message {
  id: string;
  content: string;
  isContactMessage: boolean;
}

interface Data {
  contacts: Contact[];
  selected?: Contact;
  messages: Message[];
}

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const contactId = url.searchParams.get("id");

    const contactsRes = await fetch("https://back-a-p4.onrender.com/contacts");
    const contacts: Contact[] = await contactsRes.json();

    let selected: Contact | undefined;
    let messages: Message[] = [];

    if (contactId) {
      selected = contacts.find((c) => c.id === contactId);
      const messagesRes = await fetch(`https://back-a-p4.onrender.com/messages/${contactId}`);
      messages = await messagesRes.json();
    }

    return ctx.render({ contacts, selected, messages });
  },

  async POST(req) {
    const form = await req.formData();
    const content = form.get("content");
    const contactId = form.get("contactId");

    await fetch("https://back-a-p4.onrender.com/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId, content }),
    });

    return Response.redirect(`/main?id=${contactId}`, 303);
  },
};

export default function MainPage({ data }: PageProps<Data>) {
  return (
    <html>
      <head>
        <link rel="stylesheet" href="/styles.css" />
        <title>Mensajería</title>
      </head>
      <body class="container">
        <aside class="sidebar">
          <h3>Contactos</h3>
          {data.contacts.map((contact) => (
            <a key={contact.id} href={`/main?id=${contact.id}`} class="contact-link">
              {contact.name}
            </a>
          ))}
        </aside>

        <main class="chat-area">
          <section class="messages">
            {data.selected ? (
              data.messages.map((msg) => (
                <div
                  key={msg.id}
                  class={`message ${msg.isContactMessage ? "left" : "right"}`}
                >
                  <span class="bubble">{msg.content}</span>
                </div>
              ))
            ) : (
              <p class="select-text">Selecciona un contacto para ver mensajes</p>
            )}
          </section>

          {data.selected && (
            <form method="POST" class="message-form">
              <input type="hidden" name="contactId" value={data.selected.id} />
              <input
                type="text"
                name="content"
                placeholder="Escribe un mensaje..."
                required
              />
              <button type="submit">Enviar</button>
            </form>
          )}
        </main>
      </body>
    </html>
  );
}