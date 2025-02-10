const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dbURI = process.env.MONGO_URI; // Get the URI from the environment variable

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log("MongoDB connection error:", err));
const app = express();
const PORT = 4000;

app.use(bodyParser.json());

// MongoDB Connection
mongoose
    .connect("mongodb://127.0.0.1:27017/contactsDB", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => console.error("MongoDB connection error:", err));

const ContactSchema = new mongoose.Schema({
    primaryContactId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
    name: { type: [String], default: [] },  // Make name optional with default as an empty array
    emails: { type: [String], required: true },
    phoneNumbers: { type: [String], required: true },
    secondaryContactIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model("Contact", ContactSchema);

// POST Route for adding contacts
app.post("/identify", async (req, res) => {
    try {
        let { name, email, phone } = req.body;

        if (!email || !phone) {
            return res.status(400).json({ error: "Email and phone number are required." });
        }

        // Ensure name is an array if provided, otherwise default to an empty array
        name = Array.isArray(name) ? name : (name ? [name] : []);

        console.log("Received POST request with:", { name, email, phone });

        // Check if email or phone exists in any contact (either primary or secondary)
        const existingContacts = await Contact.aggregate([
            {
                $match: {
                    $or: [{ emails: email }, { phoneNumbers: phone }],
                },
            },
            {
                $lookup: {
                    from: "contacts",
                    localField: "secondaryContactIds",
                    foreignField: "primaryContactId",
                    as: "secondaryContacts",
                },
            },
        ]);

        let primaryContact = null;
        let secondaryContactIds = new Set();

        if (existingContacts.length > 0) {
            primaryContact = existingContacts[0]; // Pick the first matching contact as primary

            console.log("Merging with existing contact:", primaryContact);

            // Collect all emails and phone numbers from existing contacts
            let allEmails = new Set(primaryContact.emails);
            let allPhones = new Set(primaryContact.phoneNumbers);

            existingContacts.forEach((contact) => {
                contact.emails.forEach((e) => allEmails.add(e));
                contact.phoneNumbers.forEach((p) => allPhones.add(p));
                contact.secondaryContactIds.forEach((id) => secondaryContactIds.add(id.toString()));
            });

            // Add new email & phone
            allEmails.add(email);
            allPhones.add(phone);

            // Get the secondary contacts (properly initialized)
            const secondaryContacts = primaryContact.secondaryContacts || [];

            // Create an array for names (including the primary name and secondary names)
            const allNames = [
                ...primaryContact.name,
                ...secondaryContacts.map((c) => c.name).flat(), // Flatten secondary names
                ...name // Add the new name being submitted
            ].filter(Boolean);

            // Deduplicate names and push them into the names array
            const uniqueNames = [...new Set(allNames)];

            // Convert secondaryContactIds back to ObjectId
            let updatedSecondaryIds = Array.from(secondaryContactIds).map((id) => new mongoose.Types.ObjectId(id));

            // Update the primary contact
            await Contact.updateOne(
                { primaryContactId: primaryContact.primaryContactId },
                {
                    $set: {
                        name: uniqueNames,  // Store the names in an array
                        emails: Array.from(allEmails),
                        phoneNumbers: Array.from(allPhones),
                        secondaryContactIds: updatedSecondaryIds,
                        updatedAt: new Date(),
                    },
                }
            );

            console.log("Updated primary contact:", primaryContact.primaryContactId);

            // Now create the new secondary contact to ensure the merged contact exists independently
            const newSecondaryContact = new Contact({
                primaryContactId: new mongoose.Types.ObjectId(),
                name: name,  // Store name as an array for the new contact
                emails: [email],
                phoneNumbers: [phone],
                secondaryContactIds: [primaryContact.primaryContactId],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            // Save the new secondary contact
            await newSecondaryContact.save();

            console.log("New secondary contact created with ID:", newSecondaryContact.primaryContactId);

        } else {
            console.log("No existing contact found. Creating a new one.");

            // Create new contact as primary
            const newContact = new Contact({
                primaryContactId: new mongoose.Types.ObjectId(),
                name: name,  // Store name as an array (can be empty)
                emails: [email],
                phoneNumbers: [phone],
                secondaryContactIds: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            await newContact.save();
            primaryContact = newContact;

            console.log("New contact created with ID:", newContact.primaryContactId);
        }

        // Response format - Returning the name as an array (updated contact)
        res.status(200).json({
            _id: primaryContact._id,  // Return the _id
            name: primaryContact.name,  // Return the name as an array (which could be empty)
            emails: primaryContact.emails,
            phoneNumbers: primaryContact.phoneNumbers,
            secondaryContactIds: Array.from(secondaryContactIds),
            updatedAt: primaryContact.updatedAt,
            createdAt: primaryContact.createdAt,
            __v: primaryContact.__v,  // Include versioning information
        });
    } catch (error) {
        console.error("Error in POST /contacts:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET Route to fetch all contacts
app.get("/identify", async (req, res) => {
    try {
        console.log("Fetching all contacts...");
        const contacts = await Contact.find();
        res.json(contacts);
    } catch (error) {
        console.error("Error in GET /contacts:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
