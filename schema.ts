export const schema = `#graphql

    type Contacto {
        id: ID!
        name: String!
        phone: String!
        country: String!
        timezone: String!
        datetime: String! 
    }


    type Query {
        getContact(id: ID!): Contacto!
        getContacts: [Contacto!]!

    }


    type Mutation{
        addContact(name: String!, phone: String!): Contacto!
        deleteContact(id: ID!): Boolean!
        updateContact(id: ID!, name: String, phone: String): Contacto!

    }
`