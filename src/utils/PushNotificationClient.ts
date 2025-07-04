export async function sendPushNotification(token: string, message: string) {
  const response = await fetch('https://<your-project-ref>.functions.supabase.co/send-push-notification', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, message }),
  });

  const data = await response.json();
  console.log('Push notification response:', data);
}
