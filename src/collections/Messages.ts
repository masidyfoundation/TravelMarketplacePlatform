import type {
  Access,
  CollectionAfterChangeHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
} from 'payload'

const conversationIDsForUser = async (req: Parameters<Access>[0]['req']): Promise<string[]> => {
  if (req.user?.collection !== 'users') return []
  const conversations = await req.payload.find({
    collection: 'conversations',
    where: { participants: { contains: req.user.id } },
    limit: 500,
    overrideAccess: true,
  })
  return conversations.docs.map((conversation) => String(conversation.id))
}

const participantMessages: Access = async ({ req }) => {
  if (req.user?.collection === 'admins') return true
  const IDs = await conversationIDsForUser(req)
  return IDs.length > 0 ? { conversation: { in: IDs } } : false
}

const prepareMessage: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== 'create' || req.user?.collection !== 'users') return data
  const conversationID =
    typeof data?.conversation === 'string' ? data.conversation : data?.conversation?.id
  const IDs = await conversationIDsForUser(req)
  if (!conversationID || !IDs.includes(String(conversationID))) {
    throw new Error('You are not part of this conversation.')
  }
  return { ...data, sender: req.user.id }
}

const notifyParticipants: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc
  const conversationID =
    typeof doc.conversation === 'string' ? doc.conversation : doc.conversation.id
  const conversation = await req.payload.findByID({
    collection: 'conversations',
    id: conversationID,
    overrideAccess: true,
  })
  const senderID = typeof doc.sender === 'string' ? doc.sender : String(doc.sender.id)
  for (const participant of conversation.participants) {
    const recipient = typeof participant === 'string' ? participant : String(participant.id)
    if (recipient === senderID) continue
    await req.payload.create({
      collection: 'notifications',
      overrideAccess: true,
      draft: false,
      data: {
        recipient,
        type: 'message',
        title: conversation.subject,
        body: String(doc.body).slice(0, 240),
        href: '/dashboard/operations',
        deliveryStatus: 'in-app',
        attempts: 0,
      },
    })
  }
  return doc
}

export const Messages: CollectionConfig = {
  slug: 'messages',
  admin: { group: 'Communications', useAsTitle: 'id' },
  access: {
    create: ({ req }) => req.user?.collection === 'users',
    delete: ({ req }) => req.user?.collection === 'admins',
    read: participantMessages,
    update: ({ req }) => req.user?.collection === 'admins',
  },
  hooks: {
    beforeValidate: [prepareMessage],
    afterChange: [notifyParticipants],
  },
  fields: [
    {
      name: 'conversation',
      type: 'relationship',
      relationTo: 'conversations',
      required: true,
      index: true,
    },
    {
      name: 'sender',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      access: {
        create: ({ req }) => req.user?.collection === 'admins',
        update: ({ req }) => req.user?.collection === 'admins',
      },
    },
    { name: 'body', type: 'textarea', required: true, maxLength: 5000 },
    { name: 'readBy', type: 'relationship', relationTo: 'users', hasMany: true },
  ],
}
