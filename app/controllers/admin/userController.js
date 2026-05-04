const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const logger = require("../../utils/logger");
const csv = require("csvtojson");

class UserController {
  async renderUserList(req, res) {
    try {
      const users = await User.find({ isDeleted: false });
      res.render("admin/users/list", {
        title: "Manage Users",
        users,
        success: req.query.success,
        error: req.query.error,
      });
    } catch (error) {
      logger.error(`Error rendering user list: ${error.message}`);
      res.status(500).send("Server Error");
    }
  }

  async renderCreateForm(req, res) {
    try {
      res.render("admin/users/create", {
        title: "Create New User",
        error: req.query.error,
      });
    } catch (error) {
      logger.error(`Error rendering create form: ${error.message}`);
      res.status(500).send("Server Error");
    }
  }

  async handleCreateUser(req, res) {
    try {
      const { name, email, password, role } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.redirect("/admin/users/create?error=Email already exists");
      }

      // Password hashing
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      await User.create({ name, email, password: hashedPassword, role });
      res.redirect("/admin/users?success=User created successfully");
    } catch (error) {
      logger.error(`Error creating user from form: ${error.message}`);
      res.redirect("/admin/users/create?error=Server Error");
    }
  }

  async bulkUploadUsers(req, res) {
    try {
      if (!req.file) {
        return res.redirect(`/admin/users?error=Please upload a CSV file`);
      }

      let csvString = req.file.buffer.toString("utf8");
      csvString = csvString.replace(/^"|"$/g, "").trim();

      const jsonArray = await csv().fromString(csvString);

      const usersToInsert = [];
      for (let row of jsonArray) {
        if (row.name && row.email && row.password) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(row.password.trim(), salt);

          usersToInsert.push({
            name: row.name.trim(),
            email: row.email.trim(),
            password: hashedPassword,
            role: row.role ? row.role.trim() : "Candidate",
          });
        }
      }

      if (usersToInsert.length === 0) {
        return res.redirect(
          `/admin/users?error=CSV is empty or invalid format`,
        );
      }

      await User.insertMany(usersToInsert, { ordered: false });

      res.redirect(
        `/admin/users?success=${usersToInsert.length} Users added successfully via CSV!`,
      );
    } catch (error) {
      logger.error(`Error in user bulk upload: ${error.message}`);
      res.redirect(
        `/admin/users?error=Failed to process CSV. Check for duplicate emails.`,
      );
    }
  }

  async renderEditForm(req, res) {
    try {
      const user = await User.findOne({ _id: req.params.id, isDeleted: false });
      if (!user) {
        return res.redirect("/admin/users?error=User Not Found");
      }
      res.render("admin/users/edit", {
        title: "Edit User",
        user,
        error: req.query.error,
      });
    } catch (error) {
      logger.error(`Error rendering edit form: ${error.message}`);
      res.status(500).send("Server Error");
    }
  }

  async handleUpdateUser(req, res) {
    try {
      const { name, role } = req.body;
      await User.findByIdAndUpdate(req.params.id, { name, role });
      res.redirect("/admin/users?success=User Updated Successfully");
    } catch (error) {
      logger.error(`Error updating user from form: ${error.message}`);
      res.redirect(`/admin/users/edit/${req.params.id}?error=Server Error`);
    }
  }

  async handleDeleteUser(req, res) {
    try {
      await User.findByIdAndUpdate(req.params.id, { isDeleted: true });
      res.redirect("/admin/users?success=User Deleted");
    } catch (error) {
      logger.error(`Error deleting user: ${error.message}`);
      res.redirect("/admin/users?error=Server Error");
    }
  }
}

module.exports = new UserController();
