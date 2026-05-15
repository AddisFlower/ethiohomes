export default function AddListingPage() {
    return (
      <main className="min-h-screen bg-gray-100 py-12 px-6">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
          <h1 className="text-4xl font-bold text-black mb-8">
            Submit Property Listing
          </h1>
  
          <form className="space-y-6">
            <div>
              <label className="block text-black font-semibold mb-2">
                Property Title
              </label>
  
              <input
                type="text"
                placeholder="Modern Apartment in Bole"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
              />
            </div>
  
            <div>
              <label className="block text-black font-semibold mb-2">
                Price (ETB)
              </label>
  
              <input
                type="number"
                placeholder="12000000"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
              />
            </div>
  
            <div>
              <label className="block text-black font-semibold mb-2">
                City
              </label>
  
              <select className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black">
                <option>Addis Ababa</option>
                <option>Adama</option>
                <option>Hawassa</option>
                <option>Bahir Dar</option>
              </select>
            </div>
  
            <div>
              <label className="block text-black font-semibold mb-2">
                Property Type
              </label>
  
              <select className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black">
                <option>Apartment</option>
                <option>Villa</option>
                <option>Land</option>
                <option>Commercial</option>
              </select>
            </div>
  
            <div>
              <label className="block text-black font-semibold mb-2">
                Description
              </label>
  
              <textarea
                rows={5}
                placeholder="Describe the property..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
              />
            </div>
  
            <button
              type="submit"
              className="w-full bg-black text-white py-4 rounded-xl text-lg font-semibold hover:bg-gray-800"
            >
              Submit Listing
            </button>
          </form>
        </div>
      </main>
    );
  }