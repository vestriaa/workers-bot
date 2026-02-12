export const commands = [
  {
    name: "lastactive",
    description: "Shows when a user was last active in GRAB.",
    options: [
      {
        name: "user_id",
        description: "The GRAB user ID",
        type: 3,
        required: true
      }
    ]
  }
];
