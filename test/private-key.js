// Copyright 2015 Joyent, Inc.  All rights reserved.

var test = require('tape').test;
var sshpk = require('../lib/index');
var path = require('path');
var fs = require('fs');

var testDir = __dirname;

var ID_RSA_FP = sshpk.parseFingerprint(
    'SHA256:tT5wcGMJkBzNu+OoJYEgDCwIcDAIFCUahAmuTT4qC3s');
var ID_DSA_FP = sshpk.parseFingerprint(
    'SHA256:PCfwpK62grBWrAJceLetSNv9CTrX8yoD0miKf11DBG8');
var ID_ECDSA_FP = sshpk.parseFingerprint(
    'SHA256:e34c67Npv31uMtfVUEBJln5aOcJugzDaYGsj1Uph5DE');
var ID_ECDSA2_FP = sshpk.parseFingerprint(
    'SHA256:Kyu0EMqH8fzfp9RXKJ6kmsk9qKGBqVRtlOuk6bXfCEU');
var ID_ED25519_FP = sshpk.parseFingerprint(
    'SHA256:2UeFLCUKw2lvd8O1zfINNVzE0kUcu2HJHXQr/TGHt60');
var ID_RSA_O_FP = sshpk.parseFingerprint(
    'SHA256:sfZqx0wyXwuXhsza0Ld99+/YNEMFyubTD8fPJ1Jo7Xw');

test('PrivateKey load RSA key', function (t) {
	var keyPem = fs.readFileSync(path.join(testDir, 'id_rsa'));
	var key = sshpk.parsePrivateKey(keyPem, 'pem');
	t.strictEqual(key.type, 'rsa');
	t.strictEqual(key.size, 1024);
	t.ok(ID_RSA_FP.matches(key));
	t.end();
});

test('PrivateKey load DSA key', function (t) {
	var keyPem = fs.readFileSync(path.join(testDir, 'id_dsa'));
	var key = sshpk.parsePrivateKey(keyPem, 'pem');
	t.strictEqual(key.type, 'dsa');
	t.strictEqual(key.size, 1024);
	t.ok(ID_DSA_FP.matches(key));
	t.end();
});

test('PrivateKey load ECDSA 384 key', function (t) {
	var keyPem = fs.readFileSync(path.join(testDir, 'id_ecdsa'));
	var key = sshpk.parsePrivateKey(keyPem, 'pem');
	t.strictEqual(key.type, 'ecdsa');
	t.strictEqual(key.size, 384);
	t.ok(ID_ECDSA_FP.matches(key));
	t.end();
});

test('PrivateKey load ECDSA 256 key', function (t) {
	var keyPem = fs.readFileSync(path.join(testDir, 'id_ecdsa2'));
	var key = sshpk.parsePrivateKey(keyPem, 'pem');
	t.strictEqual(key.type, 'ecdsa');
	t.strictEqual(key.size, 256);
	t.ok(ID_ECDSA2_FP.matches(key));
	t.end();
});

test('PrivateKey can\'t load a secp224r1 key', function (t) {
	var keyPem = fs.readFileSync(path.join(testDir, 'secp224r1_key.pem'));
	t.throws(function() {
		sshpk.parsePrivateKey(keyPem, 'pem');
	});
	t.end();
});

test('PrivateKey load ECDSA 256 key explicit curve', function (t) {
	var keyPem = fs.readFileSync(path.join(testDir, 'id_ecdsa_exp'));
	var key = sshpk.parsePrivateKey(keyPem, 'pem');
	t.strictEqual(key.type, 'ecdsa');
	t.strictEqual(key.size, 256);
	t.strictEqual(key.curve, 'nistp256');
	t.end();
});

test('PrivateKey load ED25519 256 key', function (t) {
	var keyPem = fs.readFileSync(path.join(testDir, 'id_ed25519'));
	var key = sshpk.parsePrivateKey(keyPem, 'pem');
	t.strictEqual(key.type, 'ed25519');
	t.strictEqual(key.size, 256);
	t.ok(ID_ED25519_FP.matches(key));

	keyPem = key.toBuffer('openssh');
	var key2 = sshpk.parsePrivateKey(keyPem, 'openssh');
	t.ok(ID_ED25519_FP.matches(key2));

	keyPem = key.toBuffer('pkcs1');
	var realKeyPem = fs.readFileSync(path.join(testDir, 'id_ed25519.pem'));
	t.strictEqual(keyPem.toString('base64'), realKeyPem.toString('base64'));
	t.end();
});

test('PrivateKey load ed25519 pem key', function (t) {
	var keyPem = fs.readFileSync(path.join(testDir, 'id_ed25519.pem'));
	var key = sshpk.parsePrivateKey(keyPem, 'pem');
	t.strictEqual(key.type, 'ed25519');
	t.strictEqual(key.size, 256);
	t.ok(ID_ED25519_FP.matches(key));
	t.end();
});

test('PrivateKey convert ssh-private rsa to pem', function (t) {
	var keySsh = fs.readFileSync(path.join(testDir, 'id_rsa_o'));
	var key = sshpk.parsePrivateKey(keySsh, 'ssh-private');
	t.strictEqual(key.type, 'rsa');
	t.strictEqual(key.size, 1044);
	t.ok(ID_RSA_O_FP.matches(key));

	var keyPem = key.toBuffer('pkcs8');
	var key2 = sshpk.parsePrivateKey(keyPem, 'pem');
	t.ok(ID_RSA_O_FP.matches(key2));

	var signer = key2.createSign('sha1');
	signer.update('foobar');
	var sig = signer.sign();
	/*
	 * Compare this to a known good signature from this key, generated by
	 * the openssh agent
	 */
	t.strictEqual(sig.toString(), 'CiMwFuHYzmiRY70E5XC5LqoSBItMUmpWkAUvf' +
	    'mx0T63WnX22ir+072EcMQkLDdrjWPwVHx0Cw52uA88FiC4BX74/PzB2Chi4pgTx' +
	    'p8RVRLKYY54ze+XT12iQPBU7oVRkr+ZoM3INZshZ3MhomvEQuVUQuAWlek6LLXp' +
	    'x+mVg8XlMS8g=');

	t.end();
});

var KEY_RSA, KEY_DSA, KEY_ECDSA, KEY_ECDSA2, KEY_ED25519;

test('setup keys', function (t) {
	KEY_RSA = sshpk.parsePrivateKey(fs.readFileSync(
	    path.join(testDir, 'id_rsa')), 'pem');
	KEY_DSA = sshpk.parsePrivateKey(fs.readFileSync(
	    path.join(testDir, 'id_dsa')), 'pem');
	KEY_ECDSA = sshpk.parsePrivateKey(fs.readFileSync(
	    path.join(testDir, 'id_ecdsa')), 'pem');
	KEY_ECDSA2 = sshpk.parsePrivateKey(fs.readFileSync(
	    path.join(testDir, 'id_ecdsa2')), 'pem');
	KEY_ED25519 = sshpk.parsePrivateKey(fs.readFileSync(
	    path.join(testDir, 'id_ed25519')), 'pem');
	t.end();
});

test('PrivateKey#toPublic on RSA key', function (t) {
	var pubKey = KEY_RSA.toPublic();
	t.strictEqual(KEY_RSA.type, pubKey.type);
	t.strictEqual(KEY_RSA.size, pubKey.size);
	t.strictEqual(KEY_RSA.hash('sha256').toString('base64'),
	    pubKey.hash('sha256').toString('base64'));
	t.notStrictEqual(KEY_RSA.toString('pem'), pubKey.toString('pem'));
	t.end();
});

test('PrivateKey#createSign on RSA key', function (t) {
	var s = KEY_RSA.createSign('sha256');
	s.update('foobar');
	var sig = s.sign();
	t.ok(sig);
	t.ok(sig instanceof sshpk.Signature);

	var v = KEY_RSA.createVerify('sha256');
	v.update('foobar');
	t.ok(v.verify(sig));

	t.end();
});

test('PrivateKey#createSign on DSA key', function (t) {
	var s = KEY_DSA.createSign('sha256');
	s.update('foobar');
	var sig = s.sign();
	t.ok(sig);
	t.ok(sig instanceof sshpk.Signature);

	var v = KEY_DSA.createVerify('sha256');
	v.update('foobar');
	t.ok(v.verify(sig));

	t.end();
});

test('PrivateKey#createSign on ECDSA 384 key', function (t) {
	var s = KEY_ECDSA.createSign('sha256');
	s.update('foobar');
	var sig = s.sign();
	t.ok(sig);
	t.ok(sig instanceof sshpk.Signature);

	var v = KEY_ECDSA.createVerify('sha256');
	v.update('foobar');
	t.ok(v.verify(sig));

	t.end();
});

test('PrivateKey#createSign on ECDSA 256 key', function (t) {
	var s = KEY_ECDSA2.createSign('sha256');
	s.update('foobar');
	var sig = s.sign();
	t.ok(sig);
	t.ok(sig instanceof sshpk.Signature);

	var v = KEY_ECDSA2.createVerify('sha256');
	v.update('foobar');
	t.ok(v.verify(sig));

	t.end();
});

if (process.version.match(/^v0\.[0-9]\./))
	return;

test('PrivateKey#createSign on ED25519 key', function (t) {
	var s = KEY_ED25519.createSign('sha512');
	s.write('foobar');
	var sig = s.sign();
	t.ok(sig);
	t.ok(sig instanceof sshpk.Signature);

	var v = KEY_ED25519.createVerify('sha512');
	v.write('foobar');
	t.ok(v.verify(sig));

	var v2 = KEY_ECDSA2.createVerify('sha512');
	v2.write('foobar');
	t.notOk(v2.verify(sig));

	/* ED25519 always uses SHA-512 */
	t.throws(function() {
		KEY_ED25519.createSign('sha1');
	});
	t.throws(function() {
		KEY_ED25519.createVerify('sha256');
	});

	t.end();
});
