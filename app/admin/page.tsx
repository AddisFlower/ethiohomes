export default function AdminPage() {
    const pendingListings = [
      {
        id: 1,
        title: "New Apartment Near Bole Airport",
        price: "15,200,000 ETB",
        location: "Addis Ababa, Bole",
        type: "Apartment",
        submittedBy: "Dawit Realty",
        status: "Pending",
      },
      {
        id: 2,
        title: "Commercial Space in Piassa",
        price: "42,000,000 ETB",
        location: "Addis Ababa, Piassa",
        type: "Commercial",
        submittedBy: "Habesha Properties",
        status: "Pending",
      },
      {
        id: 3,
        title: "Land Plot in Legetafo",
        price: "9,800,000 ETB",
        location: "Legetafo",
        type: "Land",
        submittedBy: "Ethio Land Brokers",
        status: "Pending",
      },
    ];
  
    return (
      <main className="min-h-screen bg-gray-100 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black">
              Admin Review Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Review pending property listings before they appear publicly.
            </p>
          </div>
  
          <div className="grid gap-6">
            {pendingListings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white rounded-2xl shadow-md p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6"
              >
                <div>
                  <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold mb-3">
                    {listing.status}
                  </span>
  
                  <h2 className="text-2xl font-bold text-black">
                    {listing.title}
                  </h2>
  
                  <p className="text-green-700 font-bold text-lg mt-1">
                    {listing.price}
                  </p>
  
                  <p className="text-gray-600 mt-1">
                    {listing.location} • {listing.type}
                  </p>
  
                  <p className="text-gray-500 mt-2">
                    Submitted by: {listing.submittedBy}
                  </p>
                </div>
  
                <div className="flex gap-3">
                  <button className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-semibold">
                    Approve
                  </button>
  
                  <button className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-lg font-semibold">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }