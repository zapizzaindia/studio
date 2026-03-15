'use server'

import admin from "firebase-admin"
import serviceAccount from "@/firebase/admin.json"

const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY!)

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any)
   })
}

export async function broadcastPushNotification(payload: {
  title: string
  body: string
  imageUrl?: string
  deepLink?: string
  tokens: string[]
}) {

  if (!payload.tokens.length) {
    return { success:false, message:"No tokens"}
  }

  try {

    const response = await admin.messaging().sendEachForMulticast({
      tokens: payload.tokens,
      notification:{
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl
      },
      data:{
        url: payload.deepLink || "/home"
      }
    })

    return {
      success:true,
      sent:response.successCount
    }

  } catch(err:any){
    console.error(err)
    return {success:false,message:err.message}
  }
}