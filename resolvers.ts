import { ObjectId, Collection } from "mongodb"
import { ContactoModel, APIPhone, APIWorldtime } from "./types.ts"
import {GraphQLError} from "graphql"



//Contexto
type Context = {
    ContactoCollection: Collection<ContactoModel>
}

//Query args
type getContactArgs = {
    id: string 
}


//Mutation args
type addContactArgs = {
    name: string,
    phone: string
}

type updateContactArgs = {
    id: string,
    name: string,
    phone: string
}

type deleteContactArgs = {
    id: string
}

export const resolvers = {
    Query: {
        getContacts: async(_parent: unknown, _args: unknown, ctx: Context): Promise<ContactoModel[]> => {
            return await ctx.ContactoCollection.find().toArray(); 
        },

        getContact: async(_parent: unknown, args: getContactArgs, ctx: Context): Promise<ContactoModel> => {
            const contactExists = await ctx.ContactoCollection.findOne({_id: new ObjectId(args.id)});

            if(!contactExists) throw new GraphQLError("Contact not in DB");

            return contactExists;
        }

    },

    Mutation: {
        addContact: async(_parent:unknown, args: addContactArgs , ctx: Context): Promise<ContactoModel> => {
            const API_KEY = Deno.env.get("API_KEY");
            if(!API_KEY){
                throw new GraphQLError("APIKEY needed");
            }

            //Obtenemos los argumentos
            const {name, phone} = args;

           
            const phoneExists = await ctx.ContactoCollection.findOne({phone: phone});
            if(phoneExists) throw new GraphQLError ("Phone is already associated to someone");

            const url = 'https://api.api-ninjas.com/v1/validatephone?number=' + phone
            const datos = await fetch(url, {
                headers: {
                "X-Api-Key": API_KEY
                }
            })

            if(datos.status !== 200) throw new GraphQLError("Ninja API error");

            const respuesta:APIPhone = await datos.json(); 

            if(!respuesta.is_valid) throw new GraphQLError("Phone number is not valid");

            const country = respuesta.country
            const timezone = respuesta.timezones[0]; 

            const{insertedId} = await ctx.ContactoCollection.insertOne({
                name, 
                phone,
                country,
                timezone
            })

            return {
                _id: insertedId,
                name,
                phone,
                country,
                timezone
            }



        },

        updateContact: async(_parent: unknown, args: updateContactArgs, ctx: Context): Promise<ContactoModel> => {
            const API_KEY = Deno.env.get("API_KEY");
            if(!API_KEY){
                throw new GraphQLError("APIKEY needed");
            }

            const {id, name, phone} = args;

            if(!name && !phone) throw new GraphQLError("At least one parameter is compulsory");


            //Si no hay telefono quiere decir que iremos aqui
            if(!phone){
                const userUpdated = await ctx.ContactoCollection.findOneAndUpdate({_id: new ObjectId(id)}, {$set: {name}}); 

                if(!userUpdated) throw new GraphQLError("No user found");

                return userUpdated; 
            }

            //Si hay telefono
            
                //Corroborar que no este el telefono asociado a otra persona
                const phoneAlreadyExists = await ctx.ContactoCollection.findOne({phone: phone});
                if(phoneAlreadyExists) throw new GraphQLError("Phone already associated to someone");

                //Corroborar que el telefono sea valido 
                const url = 'https://api.api-ninjas.com/v1/validatephone?number=' + phone
                const datos = await fetch(url, {
                    headers: {
                    "X-Api-Key": API_KEY
                    }
                })

                if(datos.status !== 200) throw new GraphQLError("Ninja API error");

                const respuesta:APIPhone = await datos.json(); 

                if(!respuesta.is_valid) throw new GraphQLError("Phone number is not valid");

                const country = respuesta.country
                const timezone = respuesta.timezones[0]

                //Actualizar los datos del telefono y los que estan asociados a el que son country y timezone
                const updatedUser = await ctx.ContactoCollection.findOneAndUpdate({_id: new ObjectId(id)}, {$set:{
                    name,
                    phone,
                    country,
                    timezone
                }})
            

                if(!updatedUser) throw new GraphQLError("Unable to update user");

                return updatedUser;

        },

        deleteContact: async(_parent:unknown, args: deleteContactArgs, ctx: Context ): Promise<boolean> =>{
            const deletedContact = await ctx.ContactoCollection.deleteOne({_id: new ObjectId(args.id)});

            if(deletedContact.deletedCount === 1) return true
            else return false;
        }
    },

    //ENCADENADOS -> Se llamaran siempre que llamemos un contacto en getContacts/getContact 
    Contacto: {
        id: (parent: ContactoModel): string => {
            return parent._id!.toString();
        },

        datetime: async(parent: ContactoModel): Promise<string> => {
            const API_KEY = Deno.env.get("API_KEY");
            if(!API_KEY){
                throw new GraphQLError("APIKEY needed");
            }

            //PRIMERO OBTENEMOS EL TELEFONO PARA PODER SACAR EL TIMEZONE 
            const urlPhone = "https://api.api-ninjas.com/v1/validatephone?number=" + parent.phone
            const datos1 = await fetch(urlPhone, {
                headers: {
                    "X-Api-Key": API_KEY
                }
            })

            if(datos1.status !== 200) throw new GraphQLError("Ninja API Error phone");
            const responsePhone:APIPhone = await datos1.json();

            const timezone = responsePhone.timezones[0] 


            //TENIENDO LA TIMEZONE NOS PODEMOS IR A LA OTRA API PARA SACAR LA HORA
            const urlTime = "https://api.api-ninjas.com/v1/worldtime?timezone=" + timezone
            const datos2 = await fetch(urlTime, {
                headers: {
                    "X-Api-Key": API_KEY
                }
            })

            if(datos2.status !== 200) throw new GraphQLError("Ninja API Error datetime");

            const responseTime: APIWorldtime = await datos2.json();

            return responseTime.datetime; //Devolvemos la hora 

        },

        country: async(parent: ContactoModel): Promise<string> => {
            const API_KEY = Deno.env.get("API_KEY");
            if(!API_KEY){
                throw new GraphQLError("APIKEY needed");
            }
            
            const url = "https://api.api-ninjas.com/v1/validatephone?number=" + parent.phone
            const datos = await fetch(url, {
                headers: {
                    "X-Api-Key": API_KEY
                }
            })

            if(datos.status !== 200) throw new GraphQLError("Ninja API Error country");

            const response:APIPhone = await datos.json();

            return response.country;

        },

        timezone: async (parent: ContactoModel): Promise<string> => {
            const API_KEY = Deno.env.get("API_KEY");
            if(!API_KEY){
                throw new GraphQLError("APIKEY needed");
            }
            const url = "https://api.api-ninjas.com/v1/validatephone?number=" + parent.phone
            const datos = await fetch(url, {
                headers: {
                    "X-Api-Key": API_KEY
                }
            })

            if(datos.status !== 200) throw new GraphQLError("Ninja API Error timezone");

            const response:APIPhone = await datos.json();

            return response.timezones[0];

        }
    }
}