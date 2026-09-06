import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { HeroAmountField } from "../hero-amount-field";

/** Mirrors how both money dialogs hold the field: canonical string in state. */
function Harness({ initial = "" }: { initial?: string }) {
  const [amount, setAmount] = useState(initial);
  return (
    <>
      <HeroAmountField
        id="amount"
        label="How much?"
        value={amount}
        onChange={setAmount}
      />
      <output data-testid="canonical">{amount}</output>
    </>
  );
}

const field = () => screen.getByLabelText(/how much/i);
const canonical = () => screen.getByTestId("canonical").textContent;

describe("HeroAmountField", () => {
  it("groups thousands as the user types", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(field(), "332342.12");

    expect(field()).toHaveValue("332,342.12");
    expect(canonical()).toBe("332342.12");
  });

  it("renders a comma-typed amount the same way as a dot-typed one", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(field(), "332342,12");

    expect(field()).toHaveValue("332,342.12");
    expect(canonical()).toBe("332342.12");
  });

  it("refuses a third cent digit", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(field(), "12.3456");

    expect(field()).toHaveValue("12.34");
  });

  it("shows a prefilled amount grouped when editing", () => {
    render(<Harness initial="332342.12" />);

    expect(field()).toHaveValue("332,342.12");
  });

  it("ignores characters that are not part of an amount", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(field(), "1a0b0");

    expect(field()).toHaveValue("100");
    expect(canonical()).toBe("100");
  });
});
