"use strict";

import { Memento } from "vscode";

/**
 * Controls the local storage of the extension
 *
 * @export
 * @class LocalStorageService
 * @typedef {LocalStorageService}
 */
export class LocalStorageService {
  /**
   * Creates an instance of LocalStorageService.
   *
   * @constructor
   * @param {Memento} storage
   */
  constructor(private storage: Memento) {}

  /**
   * Gets the value of a key, or null if it doesn't exist
   *
   * @public
   * @template T
   * @param {string} key
   * @returns {T}
   */
  public getValue<T>(key: string): T {
    return this.storage.get<T>(key, null);
  }

  /**
   * Sets the value of a key
   *
   * @public
   * @template T
   * @param {string} key
   * @param {T} value
   */
  public setValue<T>(key: string, value: T) {
    this.storage.update(key, value);
  }
}
