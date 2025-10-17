import nodemailer from "nodemailer";
export async function notifyAdmin(subject:string, message:string){
  const admin=process.env.ADMIN_EMAIL; if(!admin) return;
  const {SMTP_HOST,SMTP_USER,SMTP_PASS}=process.env as any;
  const from=process.env.SMTP_FROM||"no-reply@soulsync.app";
  if(!SMTP_HOST||!SMTP_USER||!SMTP_PASS){ console.warn("SMTP not configured; skip notify:", subject); return; }
  const transporter=nodemailer.createTransport({host:SMTP_HOST, port:Number(process.env.SMTP_PORT)||587, secure:false, auth:{user:SMTP_USER, pass:SMTP_PASS}});
  await transporter.sendMail({from,to:admin,subject,text:message});
}