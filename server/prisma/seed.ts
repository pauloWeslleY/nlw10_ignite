import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
   const user = await prisma.user.create({
      data: {
         name: 'Harry Wells',
         email: 'harry@gmail.com',
         avatarUrl: 'https://github.com/pauloWeslleY.png',
      }
   })

   const pool = await prisma.pool.create({
      data: {
         title: 'Example Pool',
         code: 'BOL123',
         ownerId: user.id,

         participants: {
            create: {
               userId: user.id,
            }
         }
      }
   })

   await prisma.game.create({
      data: {
         date: '2022-11-04T12:00:00.161Z',
         firstTeamCountryCode: 'DE',
         secondTeamCountryCode: 'BR',
      }
   })

   await prisma.game.create({
      data: {
         date: '2022-11-02T12:00:00.161Z',
         firstTeamCountryCode: 'BR',
         secondTeamCountryCode: 'AR',


         guesses: {
            create: {
               firstTeamPoint: 2,
               secondTeamPoint: 1,

               participant: {
                  connect: {
                     userId_poolId: {
                        userId: user.id,
                        poolId: pool.id,
                     }
                  }
               }
            }
         }
      }
   })
}

main()