import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

export const auditChanges =
  (collectionName: string): CollectionAfterChangeHook =>
  async ({ doc, operation, previousDoc, req }) => {
    await req.payload.create({
      collection: 'audit-logs',
      overrideAccess: true,
      draft: false,
      data: {
        actor: req.user
          ? {
              relationTo: req.user.collection,
              value: req.user.id,
            }
          : undefined,
        action: `${collectionName}.${operation}`,
        collectionName,
        documentId: String(doc.id),
        metadata: {
          previousStatus: previousDoc?.status,
          currentStatus: doc.status,
        },
      },
    })
    return doc
  }

export const auditDeletes =
  (collectionName: string): CollectionAfterDeleteHook =>
  async ({ doc, req }) => {
    await req.payload.create({
      collection: 'audit-logs',
      overrideAccess: true,
      draft: false,
      data: {
        actor: req.user
          ? {
              relationTo: req.user.collection,
              value: req.user.id,
            }
          : undefined,
        action: `${collectionName}.delete`,
        collectionName,
        documentId: String(doc.id),
      },
    })
    return doc
  }
