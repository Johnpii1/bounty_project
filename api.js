export async function createBounty(formData) {
  try {
    const response = await fetch("http://localhost:5000/task", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create bounty");
    }

    console.log("Success:", data);
    return data;
  } catch (error) {
    console.error("Error:", error.message);
  }
}
