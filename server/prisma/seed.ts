import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "password123";

interface SeedEmployee {
  key: string;
  employeeName: string;
  designation: string;
  email: string;
  phone: string;
  role: "ADMIN" | "TEAM_LEAD" | "EMPLOYEE";
  department: string;
  managerKey: string | null;
  isActive?: boolean;
  joiningDate: string;
}

const employees: SeedEmployee[] = [
  {
    key: "admin",
    employeeName: "Sarah Whitfield",
    designation: "General Manager",
    email: "admin@unze.london",
    phone: "+44 20 7946 0001",
    role: "ADMIN",
    department: "Executive",
    managerKey: null,
    joiningDate: "2019-03-01",
  },

  // Team Leads
  {
    key: "finance_lead",
    employeeName: "David Okafor",
    designation: "Finance Manager",
    email: "david.okafor@unze.london",
    phone: "+44 20 7946 0002",
    role: "TEAM_LEAD",
    department: "Finance",
    managerKey: "admin",
    joiningDate: "2020-01-15",
  },
  {
    key: "it_lead",
    employeeName: "Priya Nair",
    designation: "IT Manager",
    email: "priya.nair@unze.london",
    phone: "+44 20 7946 0003",
    role: "TEAM_LEAD",
    department: "IT",
    managerKey: "admin",
    joiningDate: "2020-06-01",
  },
  {
    key: "ops_lead",
    employeeName: "Marcus Bell",
    designation: "Operations Manager",
    email: "marcus.bell@unze.london",
    phone: "+44 20 7946 0004",
    role: "TEAM_LEAD",
    department: "Operations",
    managerKey: "admin",
    joiningDate: "2019-11-20",
  },

  // Finance team
  {
    key: "accountant1",
    employeeName: "Emily Carter",
    designation: "Accountant",
    email: "emily.carter@unze.london",
    phone: "+44 20 7946 0005",
    role: "EMPLOYEE",
    department: "Finance",
    managerKey: "finance_lead",
    joiningDate: "2021-04-12",
  },
  {
    key: "accounts_officer1",
    employeeName: "James Whitmore",
    designation: "Accounts Officer",
    email: "james.whitmore@unze.london",
    phone: "+44 20 7946 0006",
    role: "EMPLOYEE",
    department: "Finance",
    managerKey: "finance_lead",
    joiningDate: "2022-02-08",
  },
  {
    key: "accounts_officer2",
    employeeName: "Fatima Rahman",
    designation: "Accounts Officer",
    email: "fatima.rahman@unze.london",
    phone: "+44 20 7946 0007",
    role: "EMPLOYEE",
    department: "Finance",
    managerKey: "finance_lead",
    isActive: false,
    joiningDate: "2021-09-01",
  },

  // IT team
  {
    key: "swe1",
    employeeName: "Tom Richardson",
    designation: "Software Engineer",
    email: "tom.richardson@unze.london",
    phone: "+44 20 7946 0008",
    role: "EMPLOYEE",
    department: "IT",
    managerKey: "it_lead",
    joiningDate: "2022-05-16",
  },
  {
    key: "swe2",
    employeeName: "Aisha Khan",
    designation: "Software Engineer",
    email: "aisha.khan@unze.london",
    phone: "+44 20 7946 0009",
    role: "EMPLOYEE",
    department: "IT",
    managerKey: "it_lead",
    joiningDate: "2023-01-10",
  },
  {
    key: "it_support1",
    employeeName: "Liam O'Connor",
    designation: "IT Support",
    email: "liam.oconnor@unze.london",
    phone: "+44 20 7946 0010",
    role: "EMPLOYEE",
    department: "IT",
    managerKey: "it_lead",
    joiningDate: "2023-03-20",
  },

  // Operations team
  {
    key: "ops_officer1",
    employeeName: "Grace Thompson",
    designation: "Operations Officer",
    email: "grace.thompson@unze.london",
    phone: "+44 20 7946 0011",
    role: "EMPLOYEE",
    department: "Operations",
    managerKey: "ops_lead",
    joiningDate: "2021-07-19",
  },
  {
    key: "ops_officer2",
    employeeName: "Noah Fitzgerald",
    designation: "Operations Officer",
    email: "noah.fitzgerald@unze.london",
    phone: "+44 20 7946 0012",
    role: "EMPLOYEE",
    department: "Operations",
    managerKey: "ops_lead",
    joiningDate: "2022-10-03",
  },
  {
    key: "assistant1",
    employeeName: "Olivia Ferreira",
    designation: "Assistant",
    email: "olivia.ferreira@unze.london",
    phone: "+44 20 7946 0013",
    role: "EMPLOYEE",
    department: "Operations",
    managerKey: "ops_lead",
    joiningDate: "2023-06-05",
  },
  {
    key: "assistant2",
    employeeName: "Ryan Mitchell",
    designation: "Assistant",
    email: "ryan.mitchell@unze.london",
    phone: "+44 20 7946 0014",
    role: "EMPLOYEE",
    department: "Operations",
    managerKey: "ops_lead",
    isActive: false,
    joiningDate: "2022-08-22",
  },
];

async function main() {
  console.log("Seeding departments...");
  const departmentNames = [...new Set(employees.map((e) => e.department))];
  const departments = new Map<string, string>();
  for (const name of departmentNames) {
    const dept = await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    departments.set(name, dept.id);
  }

  console.log("Seeding employees...");
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const idByKey = new Map<string, string>();

  // Two passes: create without manager links first, then wire up reportingManagerId.
  for (let i = 0; i < employees.length; i++) {
    const e = employees[i];
    const employeeId = `EMP-${String(i + 1).padStart(4, "0")}`;

    const existingUser = await prisma.user.findUnique({ where: { email: e.email } });
    if (existingUser) {
      const employee = await prisma.employee.findUnique({ where: { userId: existingUser.id } });
      idByKey.set(e.key, employee!.id);
      continue;
    }

    const user = await prisma.user.create({
      data: {
        email: e.email,
        passwordHash,
        role: e.role,
        isActive: e.isActive ?? true,
        employee: {
          create: {
            employeeId,
            employeeName: e.employeeName,
            designation: e.designation,
            email: e.email,
            phone: e.phone,
            role: e.role,
            isActive: e.isActive ?? true,
            joiningDate: new Date(e.joiningDate),
            departmentId: departments.get(e.department),
          },
        },
      },
      include: { employee: true },
    });
    idByKey.set(e.key, user.employee!.id);
  }

  console.log("Wiring reporting hierarchy...");
  for (const e of employees) {
    if (!e.managerKey) continue;
    await prisma.employee.update({
      where: { id: idByKey.get(e.key)! },
      data: { reportingManagerId: idByKey.get(e.managerKey)! },
    });
  }

  console.log(`Done. ${employees.length} employees seeded. Admin login: admin@unze.london / ${PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
