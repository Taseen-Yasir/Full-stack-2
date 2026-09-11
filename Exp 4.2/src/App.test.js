import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";

describe("Optimized Calendar Application", () => {

  test("renders application title", () => {

    render(<App />);

    expect(
      screen.getByText(/Optimized Social Media Post Scheduler/i)
    ).toBeInTheDocument();

  });

  test("renders schedule button", () => {

    render(<App />);

    expect(
      screen.getByText(/Schedule Post/i)
    ).toBeInTheDocument();

  });

  test("renders search box", () => {

    render(<App />);

    expect(
      screen.getByPlaceholderText(/Search posts/i)
    ).toBeInTheDocument();

  });

  test("opens modal when schedule button is clicked", () => {

    render(<App />);

    fireEvent.click(
      screen.getByText(/Schedule Post/i)
    );

    expect(
      screen.getByText(/Schedule New Post/i)
    ).toBeInTheDocument();

  });

});