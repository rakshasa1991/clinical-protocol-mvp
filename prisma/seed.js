const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const email = 'demo@example.com'
  const password = 'Demo12345!'

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    console.log('Demo user already exists')
  } else {
    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: 'Demo User',
      },
    })

    console.log('Created demo user:', user.email)

    const project = await prisma.project.create({
      data: {
        userId: user.id,
        title: 'Demo Study - Oncology Phase II',
        therapeuticArea: 'Oncology',
        phase: 'Phase II',
        shortDescription: 'A demo study for evaluating the efficacy of a novel immuno-oncology agent in patients with advanced solid tumors.',
        studyInput: {
          create: {
            objective: 'To evaluate the objective response rate (ORR) of the investigational agent compared to standard of care.',
            design: 'Randomized, open-label, multicenter Phase II study with two arms.',
            population: 'Adults aged 18+ with histologically confirmed advanced solid tumors who have progressed on standard therapies.',
            primaryEndpoints: 'Objective Response Rate (ORR) per RECIST v1.1',
            secondaryEndpoints: 'Progression-free survival (PFS), Overall survival (OS), Safety and tolerability',
            inclusionCriteria: '1. Age ≥18 years\n2. Histologically confirmed advanced solid tumor\n3. ECOG performance status 0-1\n4. Adequate organ function',
            exclusionCriteria: '1. Active brain metastases\n2. Uncontrolled intercurrent illness\n3. Pregnancy or breastfeeding\n4. Prior treatment with similar mechanism of action',
            treatmentArms: 'Arm A: Investigational agent (n=50)\nArm B: Standard of care (n=50)',
            duration: 'Total study duration: 24 months\nTreatment until disease progression or unacceptable toxicity',
            visitSchedule: 'Screening: Up to 28 days before first dose\nTreatment visits: Every 3 weeks\nFollow-up: 30 days after last dose',
            safetyNotes: 'All serious adverse events will be reported within 24 hours. Dose modifications allowed per protocol.',
          },
        },
      },
      include: { studyInput: true },
    })

    console.log('Created demo project:', project.title)
  }

  console.log('\nDemo credentials:')
  console.log('Email: demo@example.com')
  console.log('Password: Demo12345!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
