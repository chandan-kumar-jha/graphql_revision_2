import DataLoader from "dataloader";
import Instructor, { IInstructor } from "../../models/Instructor"; // Aapka Instructor interface

const createInstructorLoader = () => {
  // 1. Generics specify kiye: Key = string, Value = IInstructor | null
  return new DataLoader<string, IInstructor | null>(
    // 2. Function argument ko `readonly string[]` Type diya
    async (instructorIds: readonly string[]) => {
      console.log("Batch IDs:", instructorIds);

      // Ab Mongoose $in operator par error NAHI dega
      const instructors = await Instructor.find({
        _id: { $in: instructorIds },
      });

      return instructorIds.map((id) => {
        return (
          instructors.find(
            (instructor) => instructor._id.toString() === id.toString()
          ) ?? null
        );
      });
    }
  );
};

export default createInstructorLoader;