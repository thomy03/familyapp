const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Supprimer toutes les tâches
  const deleted = await prisma.task.deleteMany({});
  console.log('Tâches supprimées:', deleted.count);
  
  // Voir les familles avec leurs codes
  const families = await prisma.family.findMany({ 
    include: { members: { select: { id: true, name: true, email: true } } } 
  });
  console.log('\nFamilles:');
  families.forEach(f => {
    console.log(`- ${f.name} | Code: ${f.inviteCode}`);
    console.log('  Membres:', f.members.map(m => m.name || m.email).join(', '));
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
