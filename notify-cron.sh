#!/bin/bash
# Cron script to send push notifications for FamilyApp

curl -s -X POST https://familyflow.46-225-58-233.sslip.io/api/push/send \
  -H "Authorization: Bearer familyapp-cron" \
  -H "Content-Type: application/json" \
  >> /var/log/familyapp-notifications.log 2>&1

echo " - $(date)" >> /var/log/familyapp-notifications.log
