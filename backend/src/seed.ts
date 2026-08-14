import "dotenv/config";
import connectDB from "./config/db";
import Instructor from "./models/Instructor";
import Course from "./models/Course";

const seedDatabase = async () => {
  try {
    await connectDB();

    // Purana data remove
    await Course.deleteMany({});
    await Instructor.deleteMany({});

    // Instructors
    const instructors = await Instructor.insertMany([
      {
        name: "Rahul Sharma",
        email: "rahul@example.com",
      },
      {
        name: "Amit Kumar",
        email: "amit@example.com",
      },
      {
        name: "Priya Singh",
        email: "priya@example.com",
      },
    ]);

    // Courses
    await Course.insertMany([
      {
        title: "GraphQL Basics",
        description: "Learn GraphQL fundamentals",
        instructorId: instructors[0]._id,
      },
      {
        title: "GraphQL Queries",
        description: "Learn GraphQL queries",
        instructorId: instructors[0]._id,
      },
      {
        title: "GraphQL Mutations",
        description: "Learn GraphQL mutations",
        instructorId: instructors[1]._id,
      },
      {
        title: "GraphQL Input Types",
        description: "Learn GraphQL input types",
        instructorId: instructors[1]._id,
      },
      {
        title: "GraphQL Relationships",
        description: "Learn GraphQL relationships",
        instructorId: instructors[2]._id,
      },
    ]);

    console.log("Database seeded successfully");

    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();