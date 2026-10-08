const { pool } = require('../config/database');

/**
 * Base Repository
 * Provides shared database connection and transaction handling primitives.
 */
class BaseRepository {
  /**
   * Acquire a connection from the connection pool
   */
  static async getConnection() {
    return await pool.getConnection();
  }

  /**
   * Start a database transaction on a connection
   */
  static async beginTransaction(connection) {
    if (connection) {
      await connection.beginTransaction();
    }
  }

  /**
   * Commit the transaction on a connection
   */
  static async commit(connection) {
    if (connection) {
      await connection.commit();
    }
  }

  /**
   * Rollback the transaction on a connection
   */
  static async rollback(connection) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (err) {
        console.error('Error during transaction rollback:', err);
      }
    }
  }

  /**
   * Release connection back to the connection pool
   */
  static releaseConnection(connection) {
    if (connection && typeof connection.release === 'function') {
      connection.release();
    }
  }
}

module.exports = BaseRepository;
