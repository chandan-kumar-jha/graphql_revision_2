import DataLoader from "dataloader";
import Instructor from "../../models/Instructor";

const instructorLoader = new DataLoader(async (instructorIds) => {
  console.log("Batch IDs:", instructorIds);

  const instructors = await Instructor.find({
    _id: { $in: instructorIds },
  });

  return instructorIds.map((id) => {
    return (
      instructors.find(
        (instructor) =>
          instructor._id.toString() === id.toString()
      ) ?? null
    );
  });
});

export default instructorLoader;