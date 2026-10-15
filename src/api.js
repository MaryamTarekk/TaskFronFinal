const serverDb = [
  {
    id: "TSK-101",
    title: "Audit warehouse safety supplies",
    category: "Inventory",
    priority: "High",
    stockUnits: 45,
    status: "In Progress",
    notes: "",
  },
  {
    id: "TSK-102",
    title: "Restock barcode scanner batteries",
    category: "Hardware",
    priority: "Urgent",
    stockUnits: 12,
    status: "Pending",
    notes: "",
  },
  {
    id: "TSK-103",
    title: "Recalibrate conveyor scale sensor",
    category: "Maintenance",
    priority: "Low",
    stockUnits: 80,
    status: "Completed",
    notes: "",
  },
  {
    id: "TSK-104",
    title: "Inspect forklift hydraulic fluid",
    category: "Maintenance",
    priority: "Medium",
    stockUnits: 30,
    status: "In Progress",
    notes: "",
  },
  {
    id: "TSK-105",
    title: "Cycle count shelf aisle B4",
    category: "Inventory",
    priority: "High",
    stockUnits: 150,
    status: "Pending",
    notes: "",
  },
  {
    id: "TSK-106",
    title: "Replace thermal printer heads",
    category: "Hardware",
    priority: "Urgent",
    stockUnits: 6,
    status: "Pending",
    notes: "",
  },
  {
    id: "TSK-107",
    title: "Label returned pallet inventory",
    category: "Inventory",
    priority: "Medium",
    stockUnits: 64,
    status: "Pending",
    notes: "",
  },
  {
    id: "TSK-108",
    title: "Service dock door actuators",
    category: "Maintenance",
    priority: "High",
    stockUnits: 9,
    status: "In Progress",
    notes: "",
  },
  {
    id: "TSK-109",
    title: "Update handheld scanner firmware",
    category: "Hardware",
    priority: "Low",
    stockUnits: 22,
    status: "Pending",
    notes: "",
  },
  {
    id: "TSK-110",
    title: "Reconcile damaged goods ledger",
    category: "Inventory",
    priority: "Urgent",
    stockUnits: 18,
    status: "Pending",
    notes: "",
  },
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchTasks = async (searchQuery = "", category = "All") => {
  const q = searchQuery.trim().toLowerCase();

  // Keep this delay to reproduce slow-search race conditions.
  await wait(q.length === 1 ? 1800 : 250);

  return serverDb
    .filter((task) => {
      const matchesSearch =
        !q ||
        task.title.toLowerCase().includes(q) ||
        task.id.toLowerCase().includes(q);

      const matchesCategory = category === "All" || task.category === category;

      return matchesSearch && matchesCategory;
    })
    .map((task) => ({ ...task }));
};

export const updateTask = async (id, patch) => {
  await wait(120);

  const target = serverDb.find((task) => task.id === id);

  if (!target) {
    throw new Error(`Task ${id} was not found`);
  }

  const safePatch = { ...patch };

  if (Object.hasOwn(safePatch, "stockUnits")) {
    const units = Number(safePatch.stockUnits);

    if (safePatch.stockUnits === "" || !Number.isFinite(units) || units < 0) {
      throw new Error("Stock units must be a non-negative number");
    }

    safePatch.stockUnits = units;
  }

  if (Object.hasOwn(safePatch, "notes")) {
    safePatch.notes = String(safePatch.notes ?? "");
  }

  Object.assign(target, safePatch);

  return { ...target };
};

// Save the latest task values to the mock data source.
export const saveTasks = async (tasksToSave) => {
  await wait(120);

  for (const task of tasksToSave) {
    const target = serverDb.find((item) => item.id === task.id);

    if (!target) continue;

    const stockUnits = Number(task.stockUnits);

    if (!Number.isFinite(stockUnits) || stockUnits < 0) {
      throw new Error(`Invalid stock units for ${task.id}`);
    }

    Object.assign(target, {
      ...task,
      stockUnits,
      notes: String(task.notes ?? ""),
    });
  }

  return tasksToSave.map((task) => ({ ...task }));
};
