import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Class, Course, Filter, ModalityEnum, Schedule } from "./definitions";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function doClassesOverlap(sched1: Schedule[], sched2: Schedule[]) {
  const doSchedsOverlap = (sched1: Schedule, sched2: Schedule) => {
    // 915 - 1045 vs 730 - 930
    return sched1.start <= sched2.end && sched2.start <= sched1.end;
  };

  for (const currSched1 of sched1) {
    for (const currSched2 of sched2) {
      if (currSched1.day !== currSched2.day) continue;

      const overlap = doSchedsOverlap(currSched1, currSched2);
      if (overlap) return true;
    }
  }

  return false;
}

export function createSchedules(courses: Class[][], filter?: Filter) {
  // This will store all currently made schedules.
  let createdScheds: Class[][] = [[]];

  if (filter) {
    courses = filterInitialData(courses, filter);
  }

  // First, iterate throughout all of the courses
  for (const course of courses) {
    // This will store the current combinations given the course and
    // currently created schedules.
    const newCombinations: Class[][] = [];

    // Iterate throughout all the created scheds so far.
    for (const currentSched of createdScheds) {
      // This flag is to indicate that at least 1 combination exists.
      let schedExists = false;

      // Check if overlap between any of the classes inside the
      // combinations and the current course class.
      for (const courseClass of course) {
        const overlap = currentSched.some((schedClass) =>
          doClassesOverlap(courseClass.schedules, schedClass.schedules)
        );

        // If there's an overlap, we can't add it to the schedule.
        if (overlap) continue;

        schedExists = true;
        newCombinations.push([...currentSched, courseClass]);
      }

      if (!schedExists) return [];
    }

    createdScheds = newCombinations;
  }

  return createdScheds;
}

export function filterInitialData(
  courses: Class[][],
  filter: Filter
): Class[][] {
  return courses.map((course) =>
    course.filter((courseClass) => {
      const isSchedInvalid = courseClass.schedules.some((sched) => {
        const { start, end } = filter.specific[sched.day] ?? filter.general;

        return sched.start < start || sched.end > end;
      });

      // Check if the course modality is valid
      const isModalityValid = filter.general.modalities.includes(
        courseClass.modality
      );

      // Keep the class if it passes both the schedule and modality filters
      return !isSchedInvalid && isModalityValid;
    })
  );
}

export function convertTime(time: number) {
  const hour = Math.floor(time / 100);
  const minutes = time % 100;

  return `${hour > 12 ? hour - 12 : hour}:${
    minutes > 10 ? "" : "0"
  }${minutes} ${hour >= 12 ? "PM" : "AM"}`;
}

export function toProperCase(val: string) {
  return val
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/((?<=( |-)|^).)/g, (s) => s.toUpperCase());
}

export function getLocalStorage(name: string) {
  const stored = localStorage.getItem(name);
  const parsed = stored !== null ? JSON.parse(stored) : null;

  return parsed;
}

export function modifySelectedData(
  courseCode: string,
  data: Class[] | "DELETE"
) {
  const selectedData = getLocalStorage("selected_data") ?? {};

  if (data === "DELETE") {
    delete selectedData[courseCode];
    localStorage.setItem("selected_data", JSON.stringify(selectedData));
    return;
  }

  selectedData[courseCode] = data;
  localStorage.setItem("selected_data", JSON.stringify(selectedData));
  return;
}
