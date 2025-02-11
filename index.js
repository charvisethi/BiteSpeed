const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config(); // Ensure environment variables are loaded

const dbURI = process.env.MONGO_URI; // Get MongoDB URI from environment variables
const PORT = process.env.PORT || 4000;

const app = express();
app.use(bodyParser.json());

// MongoDB Connection
mongoose
    .connect(dbURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => console.error("MongoDB connection error:", err));

const ContactSchema = new mongoose.Schema({
    primaryContactId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
    name: { type: [String], default: [] },
    emails: { type: [String], required: true },
    phoneNumbers: { type: [String], required: true },
    secondaryContactIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model("Contact", ContactSchema);

// POST Route for adding contacts (original logic retained)
app.post("/identify", async (req, res) => {
    try {
        let { name, email, phone } = req.body;

        if (!email || !phone) {
            return res.status(400).json({ error: "Email and phone number are required." });
        }

        name = Array.isArray(name) ? name : (name ? [name] : []);

        console.log("Received POST request with:", { name, email, phone });

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
            primaryContact = existingContacts[0];
            console.log("Merging with existing contact:", primaryContact);

            let allEmails = new Set(primaryContact.emails);
            let allPhones = new Set(primaryContact.phoneNumbers);

            existingContacts.forEach((contact) => {
                contact.emails.forEach((e) => allEmails.add(e));
                contact.phoneNumbers.forEach((p) => allPhones.add(p));
                contact.secondaryContactIds.forEach((id) => secondaryContactIds.add(id.toString()));
            });

            allEmails.add(email);
            allPhones.add(phone);

            const secondaryContacts = primaryContact.secondaryContacts || [];
            const allNames = [
                ...primaryContact.name,
                ...secondaryContacts.map((c) => c.name).flat(),
                ...name
            ].filter(Boolean);

            const uniqueNames = [...new Set(allNames)];
            let updatedSecondaryIds = Array.from(secondaryContactIds).map((id) => new mongoose.Types.ObjectId(id));

            await Contact.updateOne(
                { primaryContactId: primaryContact.primaryContactId },
                {
                    $set: {
                        name: uniqueNames,
                        emails: Array.from(allEmails),
                        phoneNumbers: Array.from(allPhones),
                        secondaryContactIds: updatedSecondaryIds,
                        updatedAt: new Date(),
                    },
                }
            );

            console.log("Updated primary contact:", primaryContact.primaryContactId);

            const newSecondaryContact = new Contact({
                primaryContactId: new mongoose.Types.ObjectId(),
                name: name,
                emails: [email],
                phoneNumbers: [phone],
                secondaryContactIds: [primaryContact.primaryContactId],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            await newSecondaryContact.save();
            console.log("New secondary contact created with ID:", newSecondaryContact.primaryContactId);

        } else {
            console.log("No existing contact found. Creating a new one.");

            const newContact = new Contact({
                primaryContactId: new mongoose.Types.ObjectId(),
                name: name,
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

        res.status(200).json({
            _id: primaryContact._id,
            name: primaryContact.name,
            emails: primaryContact.emails,
            phoneNumbers: primaryContact.phoneNumbers,
            secondaryContactIds: Array.from(secondaryContactIds),
            updatedAt: primaryContact.updatedAt,
            createdAt: primaryContact.createdAt,
            __v: primaryContact.__v,
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
    console.log(`Server running on port ${PORT}`);
});
