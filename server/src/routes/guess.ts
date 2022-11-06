import { FastifyInstance } from "fastify"
import { z } from "zod"
import { prisma } from "../lib/prisma"
import { authenticate } from "../plugins/authenticate"

export async function guessRoutes(fastify: FastifyInstance) {
   fastify.get('/guesses/count', async () => {
      const count = await prisma.guess.count()

      return { count }
   })

   //[] <|=== === ROTAS DE CRIAÇÃO DE UM PALPITE!
   fastify.post('/pools/:poolId/games/:gameId/guesses', {
      onRequest: [authenticate]
   }, async (request, reply) => {
      const createGuessParams = z.object({
         poolId: z.string(),
         gameId: z.string(),
      })

      const createGuessBody = z.object({
         firstTeamPoint: z.number(),
         secondTeamPoint: z.number(),
      })

      const { poolId, gameId } = createGuessParams.parse(request.params)
      const { firstTeamPoint, secondTeamPoint } = createGuessBody.parse(request.body)

      // TODO: <|=== === === PROCURA PARTICIPANTE!
      const participant = await prisma.participant.findUnique({
         where: {
            userId_poolId: {
               poolId,
               userId: request.user.sub,
            }
         }
      })

      // TODO: <|=== === === === VALIDAÇÃO CASO O PARTICIPANTE NÃO EXISTA!
      if (!participant) {
         return reply.status(400).send({
            message: "You're not allowed to create a guess inside this pool!",
         })
      }

      // TODO: <|=== === === PROCURA SE JÁ EXISTE UM PALPITE ENVIADO POR ESSE USUÁRIO!
      const guess = await prisma.guess.findUnique({
         where: {
            participantId_gameId: {
               participantId: participant.id,
               gameId
            }
         }
      })

      if (guess) {
         return reply.status(400).send({
            message: "You already sent a guess to this game on this pool!",
         })
      }

      // TODO: <|=== === === === PROCURA PELO GAME!
      const game = await prisma.game.findUnique({
         where: {
            id: gameId,
         }
      })

      // TODO: <|=== === === SE O GAME NÃO EXISTIR RETORNA UM ERRO!
      if (!game) {
         return reply.status(400).send({
            message: "Game not found!",
         })
      }

      if (game.date < new Date()) {
         return reply.status(400).send({
            message: "You cannot send guesses after the game date!",
         })
      }

      // TODO: <|=== === === === CRIAÇÃO DO NOVO PALPITE!
      await prisma.guess.create({
         data: {
            gameId,
            participantId: participant.id,
            firstTeamPoint,
            secondTeamPoint
         }
      })

      return reply.status(201).send()

      // return {
      //    poolId,
      //    gameId,
      //    firstTeamPoint,
      //    secondTeamPoint,
      // }
   })
}