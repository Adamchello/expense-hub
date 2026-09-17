import {
  avatarInitial,
  displayNameFrom,
  greetingFor,
  timeOfDayGreeting,
} from "../user-display";

describe("timeOfDayGreeting", () => {
  it.each([
    [0, "Good morning"],
    [11, "Good morning"],
    [12, "Good afternoon"],
    [17, "Good afternoon"],
    [18, "Good evening"],
    [23, "Good evening"],
  ])("hour %i → %s", (hour, expected) => {
    expect(timeOfDayGreeting(hour)).toBe(expected);
  });
});

describe("displayNameFrom", () => {
  it("takes the first dotted segment of the local part, title-cased", () => {
    expect(displayNameFrom("ada.lovelace@x.com")).toBe("Ada");
    expect(displayNameFrom("GRACE_hopper@x.com")).toBe("Grace");
    expect(displayNameFrom("linus-t@x.com")).toBe("Linus");
  });

  it("returns nothing rather than a digit string or a one-letter name", () => {
    expect(displayNameFrom("12345@x.com")).toBe("");
    expect(displayNameFrom("a@x.com")).toBe("");
    expect(displayNameFrom(undefined)).toBe("");
  });
});

describe("avatarInitial", () => {
  it("uppercases the first letter", () => {
    expect(avatarInitial("ada@x.com")).toBe("A");
    expect(avatarInitial("  ada@x.com")).toBe("A");
  });

  it("returns null when the first character is not a letter", () => {
    expect(avatarInitial("1ada@x.com")).toBeNull();
    expect(avatarInitial("")).toBeNull();
    expect(avatarInitial(undefined)).toBeNull();
  });
});

describe("greetingFor", () => {
  it("adds the name when one can be read", () => {
    expect(greetingFor("ada@x.com", new Date(2026, 0, 1, 9))).toBe(
      "Good morning, Ada",
    );
  });

  it("omits the name otherwise", () => {
    expect(greetingFor("42@x.com", new Date(2026, 0, 1, 20))).toBe(
      "Good evening",
    );
  });
});
