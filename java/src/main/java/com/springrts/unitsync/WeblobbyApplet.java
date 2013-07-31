
/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 *
 * @author cc
 * @license GPL 2
 */

package com.springrts.unitsync;


import com.springrts.unitsync.impl.jna.UnitsyncImpl;
import com.sun.jna.Library;
import com.sun.jna.Native;
import java.applet.Applet;
import java.awt.HeadlessException;
import java.io.*;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.URL;
import java.nio.ByteBuffer;
import java.nio.channels.Channels;
import java.nio.channels.ReadableByteChannel;
import java.security.AccessController;
import java.security.PrivilegedAction;
import java.util.*;
import java.util.prefs.Preferences;
import java.util.regex.Matcher;


import java.io.*;
import java.net.*;
import java.util.zip.CRC32;

//import javax.swing.JApplet;

//public class UnitsyncApplet extends JApplet {
public class WeblobbyApplet extends Applet {
    
    private Map<String, Process> processes = new HashMap<String, Process>();
    private String os;
    private String springHome;
    private String slash;
    private JavaSocketBridge javaSocketBridge = new JavaSocketBridge(this);
    private boolean trustedRunner;

    public WeblobbyApplet()
    {
        trustedRunner = false;

        springHome = "";
        try {
            this.dsocket = new DatagramSocket();
        } catch (Exception e) {
            System.err.println(e);
            for(int i=0; i<e.getStackTrace().length; i++)
            {
                echoJs( e.getStackTrace()[i]+"" ); 
            }
        }
        
    }

    public class UntrustedException extends Exception {
        public UntrustedException()
        {
            super("The host running this applet is not trusted.");
        }
    }

    private void throwIfUntrusted() throws UntrustedException
    {
        if(!trustedRunner)
            throw new UntrustedException();
    }

    public void init() throws HeadlessException
    {
        if(getDocumentBase().getProtocol().equals("file") || getDocumentBase().getHost().equals("weblobby.springrts.com") ||
                getDocumentBase().getHost().equals("localhost"))
            trustedRunner = true;

        final String os = System.getProperty("os.name").toLowerCase();
                
        AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                try
                {
                    if(os.indexOf("win") >= 0) setOs("Windows");
                    else if(os.indexOf("nux") >= 0) setOs("Linux");
                    else if(os.indexOf("mac") >= 0) setOs("Mac");
                    return null;
                }
                catch (UntrustedException e)
                {
                    return null;
                }
            }
        });
    }
    
    public boolean connect(final String url, final int p) throws UntrustedException
    {
        throwIfUntrusted();
        return (Boolean)AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                return javaSocketBridge.connect(url, p);
            }
        });
        //return this.javaSocketBridge.connect(url, p);
    }
    public boolean disconnect()
    {
        return this.javaSocketBridge.disconnect();
    }
    public boolean send(String message)
    {
        return this.javaSocketBridge.send(message);
    }
    
    public String listDirs( final String path ) throws UntrustedException
    {
        throwIfUntrusted();
        return this.listFilesPriv(path, true);
    }
    public String listFiles( final String path ) throws UntrustedException
    {
        throwIfUntrusted();
        return this.listFilesPriv(path, false);
    }
    
    private String listFilesPriv( final String path, final boolean dirs )
    {
        ArrayList<String> files = (ArrayList<String>)AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                List<String> files = new ArrayList<String>();
                
                File folder = new File(path);
                if( folder.exists() )
                {
                    File[] listOfFiles = folder.listFiles(); 
                
                    for (int i = 0; i < listOfFiles.length; i++) 
                    {
                        if( dirs )
                        {
                            if (listOfFiles[i].isDirectory()) 
                            {
                                files.add(listOfFiles[i].getName());
                            }
                        }
                        else
                        {
                            files.add(listOfFiles[i].getName());
                        }
                    }
                }
                return files;
            }
        });
        String out = "";
        if( files.size() > 0 )
        {
            out += files.remove(0);
            for(String file : files)
            {
                out += "||" + file;
            }
        }

        return out;
    }
    
    public void createScript(String scriptFile, String script) throws UntrustedException
    {
        throwIfUntrusted();
        this.createScriptFile(scriptFile, script);
    }
    
    public UnitsyncImpl getUnitsync(final String unitsyncPath) throws UntrustedException
    {
        throwIfUntrusted();
        
        //NativeLibrary.addSearchPath("unitsync", unitsyncPathFull);
        //Preferences.userRoot().put("unitsync.path", "unitsync");
        final WeblobbyApplet weblobbyApplet = this;
        UnitsyncImpl unitsync = AccessController.doPrivileged(new PrivilegedAction<UnitsyncImpl>() {
            public UnitsyncImpl run() 
            {
                try
                {   
                    //echoJs("unitsyncPathFull = " + unitsyncPathFull);
        
                    File f = new File(unitsyncPath);
                    {
                        if( !f.exists() )
                        {
                            return null;
                        }
                    }
                    /** /
                    Preferences.userRoot().put("unitsync.path", unitsyncPathFull);
                    return new UnitsyncImpl();
                    /**/
                    UnitsyncImpl test = new UnitsyncImpl( unitsyncPath, weblobbyApplet );
                    return test;
                    
                }
                catch (Exception e) 
                {
                    WriteToLogFile( e );
                    return null;
                }
            }
        });
        return unitsync;
    }
    
    private int byteToInt(byte b)
    {
        return (int) b & 0xff;
    }
    private int byteToShort(byte b)
    {
        return (short) ((short) b & 0xff);
    }
    
    public int[] jsReadFileVFS(String unitsyncPath, int fd, int size) throws UntrustedException
    {
        throwIfUntrusted();

        byte[] bytes = new byte[size];
        ByteBuffer buff = ByteBuffer.wrap(bytes);
        int bytesRead;
        bytesRead = this.getUnitsync(unitsyncPath).readFileVFS(fd, buff, size );
        //this.echoJs( buff.toString() );
        this.echoJs( "Bytes read: " + bytesRead );
        byte[] byteArray = buff.array();
        int[] ints = new int[ byteArray.length ];
        
        for (int i = 0; i < byteArray.length; ++i) 
        { 
            //ints[i] = (int)byteArray[i];
            //ints[i] = byteToInt( byteArray[i] );
            ints[i] = byteArray[i];
            
        }
        return ints;
    }

    
    
    public boolean killCommand( final String cmdName ) throws UntrustedException
    {
        throwIfUntrusted();

        AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                Process p = processes.get(cmdName);
                if( p != null )
                {
                    p.destroy();
                }
                return null;
            }
        });
        return true;
    }
    
    
    private void setOs(String os) throws UntrustedException
    {
        throwIfUntrusted();

        this.os = os;
        File f;
        this.slash = os.equals("Windows") ? "\\" : "/";
        if( springHome != "" );
        else if( os.equals("Windows") )
        {
            springHome = System.getProperty("user.home") + "\\Documents\\My Games\\Spring";
        }
        else if( os.equals("Mac") || os.equals("Linux")  )
        {
            springHome = System.getProperty("user.home") + "/.spring";
        }
        else
        {
            return;
        }
        f = new File( springHome );
        f.mkdirs();
        if(!f.isDirectory())
        {
		doJs("alert('Cannot access spring home folder " + jsFix(springHome) + "\nApparently, automatic detection has failed. Please set the correct one in settings.');");
        }
        
        String weblobbyHome = springHome + this.slash + "weblobby";
        
        f = new File( weblobbyHome + this.slash + "engine" );
        f.mkdirs();
        
        f = new File( weblobbyHome + this.slash + "pr-downloader" );
        f.mkdirs();
        
        f = new File( weblobbyHome + this.slash + "logs" );
        f.mkdirs();
    }
    
    public String getSpringHome()
    {
        return this.springHome;
    }

    // Should be called prior to init() to take effect.
    public void setSpringHome(final String path)
    {
	this.springHome = path;
    }
    
    public void createDir(final String path) throws UntrustedException
    {
        throwIfUntrusted();

        AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                File f = new File( path );
                f.mkdir();
                return null;
            }
        });
    }
    
    public void runCommand( final String cmdName, final String[] cmd ) throws UntrustedException
    {
        throwIfUntrusted();

        /*
         * Chromium Bug:
         * cmd is coming in as a string(?) instead of as an array of strings. 
         * Appears fine in javascript but not in this function
         * Chromium only, not Windows Chrome
         */
        /*
        echoJs( "begin runCommand1: " );
        echoJs( "begin runCommand2: " + cmd );
        echoJs( "begin runCommand3: " + cmd[0] );
        */
       
        new Thread(new Runnable() {
                public void run() {
                    runCommandThread(cmdName, cmd);
                } 
        }).start(); //new Thread(new Runnable() {
    }
    
    private void createScriptFile(final String scriptFile, final String script) throws UntrustedException
    {
        throwIfUntrusted();

         AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                echoJs( "Creating script: " + scriptFile );
                try
                {   
                    PrintWriter out = new PrintWriter( scriptFile );
                    echoJs( "Writing to script file: " +  scriptFile );
                    out.print(script);
                    out.close();
                }
                catch(Exception e)
                {
                    WriteToLogFile( e );
                }
                return null;
            }
         });
    }
    
    public void createUiKeys(final String path) throws UntrustedException
    {
        throwIfUntrusted();

        AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                echoJs( "Creating empty uikeys: " + path );
                try
                {   
                    PrintWriter out = new PrintWriter( path );
                    out.print("");
                    out.close();
                }
                catch(Exception e)
                {
                    WriteToLogFile( e );
                }
                return null;
            }
         });
    }
    public void deleteSpringSettings(final String path) throws UntrustedException
    {
        throwIfUntrusted();

        if( !path.endsWith("springsettings.cfg") )
        {
            echoJs( "Delete SpringSettings error: " + path );
            return;
        }
        AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                echoJs( "Delete SpringSettings: " + path );
                try
                {   
                    File f = new File( path );
                    f.delete();
                }
                catch(Exception e)
                {
                    WriteToLogFile( e );
                }
                return null;
            }
         });
    }
    
    public String jsFix(String str)
    {
        str = str.replace("\\", "\\\\");
        str = str.replace("'", "\\'");
        str = str.replace("\n", "\\n");
        str = str.replace("\r", "");
        return str;
    }
    
    private void setupEnvironment( ProcessBuilder pb )
    {
        pb.environment().put( "OMP_WAIT_POLICY", "ACTIVE" );
    }
    
    private void runCommandThread( final String cmdName, final String[] cmd )
    {
        if( cmd[0].contains( "pr-downloader" ) )
        {
            //String newCmd = this.springHome + this.slash + "pr-downloader" + this.slash + "pr-downloader";
            //cmd[0] = cmd[0].replace( "pr-downloader", newCmd );
        }
        else if(cmd[0].toLowerCase().contains( "spring" ) )
        {
            this.echoJs( "Starting Spring shortly... " +  cmd[0] );
        }
        else if(cmd[1].toLowerCase().contains( "spring" ) )
        {
            this.echoJs( "Starting Spring shortly... " +  cmd[0] + " " + cmd[1] );
        }
        else
        {
            this.echoJs( "Bad command." );
            return;
        }
        
        AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                if( processes.get(cmdName) != null )
                {
                    return null;
                }
                try
                {
                    //echoJs( "running command... " + cmd[0] );
                    
                    /*
                    Runtime runtime = Runtime.getRuntime();
                    Process pr = runtime.exec( cmd2 );
                    */
                    
                    ProcessBuilder builder = new ProcessBuilder(cmd);
                    builder.redirectErrorStream(true);
                    setupEnvironment( builder );
                    Process pr = builder.start();
                    
                    processes.put(cmdName, pr);
                    
                    BufferedReader buf = new BufferedReader(new InputStreamReader(pr.getInputStream()));
                    
                    String line = "";
                   
                    while ((line=buf.readLine())!=null) 
                    {
                        doJs("commandStream('"+ jsFix(cmdName) +"', '"+jsFix(line)+"')");
                    }
                    processes.remove(cmdName);
                    doJs("commandStream('exit', '"+jsFix(cmdName)+"')");
                        
                }
                 
                catch (Exception e) 
                {
                    WriteToLogFile( e );
                    
                    for(int i=0; i<e.getStackTrace().length; i++)
                    {
                       echoJs( e.getStackTrace()[i]+"" ); 
                    }
                }
                
                
                return null;
            }
        });//AccessController.doPrivileged(new PrivilegedAction() { 
    }
    
    
    private void WriteToLogFile( Exception e )
    {
        if(!trustedRunner)
            return;

        String logFile = this.springHome + this.slash + "WebLobbyLog.txt" ;
        try
        {   
            PrintWriter out = new PrintWriter( logFile );
            echoJs( "Error. Writing to log file: " +  logFile );
            out.println( "Begin log file.\n" );   
            
            e.printStackTrace( out );
            
            out.close();
        }
        catch(Exception e2)
        {
            echoJs( "Log file ("+logFile+") not found: " + e2.toString() );
        }
                                
    }
    
    public boolean WriteToFile( final String logFile, final String line ) throws UntrustedException
    {
        throwIfUntrusted();

        return (Boolean)AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                try
                {   
                    PrintWriter out = new PrintWriter(new FileWriter(logFile, true));
                    out.println(line);
                    out.close();
                }
                catch(Exception e)
                {
                    echoJs( "Problem writing to log file ("+logFile+"): " + e.toString() );
                    return false;
                }
                return true;
            }
        });                     
    }
    
    public String ReadFileLess( final String logFile, final int numLines ) throws UntrustedException
    {
        throwIfUntrusted();

        return (String)AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                try
                {   
                    File f = new File(logFile);
                    if(!f.exists()) 
                    { 
                        return "";
                    }
                    String lessOut = "";
                    Stack<String> lessOutList = new Stack<String>();
                    BufferedReader br = null;
                    br = new BufferedReader(new FileReader(logFile));
                    String curLine;
 
                    while ((curLine = br.readLine()) != null) 
                    {
                        lessOutList.push(curLine);
                    }
                    
                    for(int i=1; i <= numLines && !lessOutList.empty() ; i++ ) 
                    {
                        lessOut = lessOutList.pop() + "\n" + lessOut;
                    }
                    return lessOut;
                }
                catch(Exception e)
                {
                    echoJs( "Problem reading from log file ("+logFile+"): " + e.toString() );
                    return "";
                }
            }
        });                     
    }
    
    
    public String ReadFileMore( final String logFile, final int numLines ) throws UntrustedException
    {
        throwIfUntrusted();

        return (String)AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                try
                {   
                    File f = new File(logFile);
                    if(!f.exists()) 
                    { 
                        return "";
                    }
                    String out = "";
                    String curLine;
                    int curLineNum = 1;
                    
                    BufferedReader br = null;
                    br = new BufferedReader(new FileReader(logFile));
 
                    while ((curLine = br.readLine()) != null && curLineNum <= numLines ) 
                    {
                        out += curLine;
                        curLineNum++;
                    }
                    
                    return out;
                }
                catch(Exception e)
                {
                    echoJs( "Problem reading from log file ("+logFile+"): " + e.toString() );
                    return "";
                }
            }
        });                     
    }
    
    
    public void echoJs(String out )
    {
        out = jsFix(out);
        doJs( "console.log('<Java> " + out + "'); ");
    }
    
    public void doJs( String jscmd )
    {
	jscmd = "__java_js_wrapper(function(){" + jscmd + "}, this);";
        String jsresult = null;
        boolean success = false;
        try {
        Method getw = null, eval = null;
        Object jswin = null;
        Class c = Class.forName("netscape.javascript.JSObject"); /* does it in IE too */
        Method ms[] = c.getMethods();
        for (int i = 0; i < ms.length; i++) {
            if (ms[i].getName().compareTo("getWindow") == 0)
                getw = ms[i];
            else if (ms[i].getName().compareTo("eval") == 0)
                eval = ms[i];
            
        }
        Object a[] = new Object[1];
        a[0] = this;               /* this is the applet */
        jswin = getw.invoke(c, a); /* this yields the JSObject */
        a[0] = jscmd;
        Object result = eval.invoke(jswin, a);
        if (result instanceof String)
            jsresult = (String) result;
        else
            jsresult = result.toString();
        success = true;
        }

        catch (InvocationTargetException ite) {
        jsresult = "" + ite.getTargetException();
        }
        catch (Exception e) {
        jsresult = "" + e;
        }

        if (success)
            System.out.println("eval succeeded, result is " + jsresult);
        else
            System.out.println("eval failed with error " + jsresult);
    }   
    
    public boolean downloadFile(final String source, final String target) throws UntrustedException
    {
        throwIfUntrusted();

        AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                downloadFilePriv(source, target );
                return null;
            }
        });
        return true;
    }
     
    public boolean downloadFilePriv(String source, String target)
    {
        try
        {
            echoJs("Copy file: " + source + " > " + target );
            URLConnection dl = new URL( source ).openConnection();
            dl.setUseCaches(false);

            File f = new File(target);
            dl.setIfModifiedSince( f.lastModified() );

            if( dl.getContentLength() <= 0 )
            {
                echoJs("File not modified, using cache");
                return true;
            }

            ReadableByteChannel rbc = Channels.newChannel(dl.getInputStream());

            FileOutputStream fos = new FileOutputStream( target );
            fos.getChannel().transferFrom(rbc, 0, 1 << 24);
            //System.out.println(fos.getChannel().size());
            fos.close();
            rbc.close();
            
            if( target.endsWith("pr-downloader") )
            {
                CLibrary libc = (CLibrary) Native.loadLibrary("c", CLibrary.class); //breaks applet on windows
                /*
                Path targetFile = Paths.get(target); // fails on Linux
                Set<PosixFilePermission> perms = PosixFilePermissions.fromString("rwxr-x---");
                Files.setPosixFilePermissions(targetFile, perms);
                */
                libc.chmod(target, 0750);
            }

        }
        catch( Exception e )
        {
            echoJs("URL error 2 " + e.toString());
            for(int i=0; i<e.getStackTrace().length; i++)
            {
                echoJs( e.getStackTrace()[i]+"" );
            }
            return false;
        }
        return true;
    }

    interface CLibrary extends Library {
        public int chmod(String path, int mode);
    }
    
    private DatagramSocket dsocket;
    public int sendSomePacket(final String host, final int port, final String messageString ) throws UntrustedException
    {
        throwIfUntrusted();
        
        return (Integer)AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                
                try {
                    //String host = "www.java2s.com";
                    //int port = 90;

                    byte[] message = messageString.getBytes();

                    // Get the internet address of the specified host
                    InetAddress address = InetAddress.getByName(host);

                    // Initialize a datagram packet with data and address
                    DatagramPacket packet = new DatagramPacket(message, message.length, address, port);

                    // Create a datagram socket, send the packet through it, close it.
                    //DatagramSocket dsocket = new DatagramSocket();
                    dsocket.send(packet);
                    echoJs(""+dsocket.getLocalPort());
                    return dsocket.getLocalPort();
                    //dsocket.close();
                } catch (Exception e) {
                    System.err.println(e);
                    for(int i=0; i<e.getStackTrace().length; i++)
                    {
                        echoJs( e.getStackTrace()[i]+"" ); 
                    }
                }
                return -1;
            }
        });//AccessController.doPrivileged(new PrivilegedAction() { 
        
    } //sendSomePacket
    
    
    public String getMacAddress() throws UntrustedException
    {
        throwIfUntrusted();

         return (String)AccessController.doPrivileged(new PrivilegedAction() { 
            public Object run()
            {
                
                try 
                {
                    InetAddress ip = InetAddress.getLocalHost();
                    NetworkInterface network = NetworkInterface.getByInetAddress(ip);
                    byte[] mac = network.getHardwareAddress();
                    if( mac != null && mac.length > 0 )
                    {
                        StringBuilder sb = new StringBuilder();
                        //sb.append( mac.length + "" );	
                        for (int i = 0; i < mac.length; i++) {
                            //sb.append(String.format("%02X%s", mac[i], (i < mac.length - 1) ? ":" : ""));
                            sb.append(String.format( byteToInt( mac[i] ) +"%s", (i < mac.length - 1) ? ":" : ""));	
                        }

                        return sb.toString();
                    }
                } 
                catch (UnknownHostException e) 
                {
                    for(int i=0; i<e.getStackTrace().length; i++)
                    {
                        echoJs( e.getStackTrace()[i]+"" ); 
                    }
                } 
                catch (SocketException e)
                {
                    for(int i=0; i<e.getStackTrace().length; i++)
                    {
                        echoJs( e.getStackTrace()[i]+"" ); 
                    }
                }
                return "";
            }
         });
           
    } //getMacAddress
    
    public long getUserID() throws UntrustedException
    {
        throwIfUntrusted();

        String mac = this.getMacAddress();
        CRC32 crc32 = new CRC32();
        mac += "lobby.springrts.com";
        crc32.update( mac.getBytes() );
        
        
        return crc32.getValue();
        
        
        
        /** /
        
        int[] table = {
            0x00000000, 0x77073096, 0xee0e612c, 0x990951ba, 0x076dc419, 0x706af48f, 0xe963a535, 0x9e6495a3,
            0x0edb8832, 0x79dcb8a4, 0xe0d5e91e, 0x97d2d988, 0x09b64c2b, 0x7eb17cbd, 0xe7b82d07, 0x90bf1d91,
            0x1db71064, 0x6ab020f2, 0xf3b97148, 0x84be41de, 0x1adad47d, 0x6ddde4eb, 0xf4d4b551, 0x83d385c7,
            0x136c9856, 0x646ba8c0, 0xfd62f97a, 0x8a65c9ec, 0x14015c4f, 0x63066cd9, 0xfa0f3d63, 0x8d080df5,
            0x3b6e20c8, 0x4c69105e, 0xd56041e4, 0xa2677172, 0x3c03e4d1, 0x4b04d447, 0xd20d85fd, 0xa50ab56b,
            0x35b5a8fa, 0x42b2986c, 0xdbbbc9d6, 0xacbcf940, 0x32d86ce3, 0x45df5c75, 0xdcd60dcf, 0xabd13d59,
            0x26d930ac, 0x51de003a, 0xc8d75180, 0xbfd06116, 0x21b4f4b5, 0x56b3c423, 0xcfba9599, 0xb8bda50f,
            0x2802b89e, 0x5f058808, 0xc60cd9b2, 0xb10be924, 0x2f6f7c87, 0x58684c11, 0xc1611dab, 0xb6662d3d,
            0x76dc4190, 0x01db7106, 0x98d220bc, 0xefd5102a, 0x71b18589, 0x06b6b51f, 0x9fbfe4a5, 0xe8b8d433,
            0x7807c9a2, 0x0f00f934, 0x9609a88e, 0xe10e9818, 0x7f6a0dbb, 0x086d3d2d, 0x91646c97, 0xe6635c01,
            0x6b6b51f4, 0x1c6c6162, 0x856530d8, 0xf262004e, 0x6c0695ed, 0x1b01a57b, 0x8208f4c1, 0xf50fc457,
            0x65b0d9c6, 0x12b7e950, 0x8bbeb8ea, 0xfcb9887c, 0x62dd1ddf, 0x15da2d49, 0x8cd37cf3, 0xfbd44c65,
            0x4db26158, 0x3ab551ce, 0xa3bc0074, 0xd4bb30e2, 0x4adfa541, 0x3dd895d7, 0xa4d1c46d, 0xd3d6f4fb,
            0x4369e96a, 0x346ed9fc, 0xad678846, 0xda60b8d0, 0x44042d73, 0x33031de5, 0xaa0a4c5f, 0xdd0d7cc9,
            0x5005713c, 0x270241aa, 0xbe0b1010, 0xc90c2086, 0x5768b525, 0x206f85b3, 0xb966d409, 0xce61e49f,
            0x5edef90e, 0x29d9c998, 0xb0d09822, 0xc7d7a8b4, 0x59b33d17, 0x2eb40d81, 0xb7bd5c3b, 0xc0ba6cad,
            0xedb88320, 0x9abfb3b6, 0x03b6e20c, 0x74b1d29a, 0xead54739, 0x9dd277af, 0x04db2615, 0x73dc1683,
            0xe3630b12, 0x94643b84, 0x0d6d6a3e, 0x7a6a5aa8, 0xe40ecf0b, 0x9309ff9d, 0x0a00ae27, 0x7d079eb1,
            0xf00f9344, 0x8708a3d2, 0x1e01f268, 0x6906c2fe, 0xf762575d, 0x806567cb, 0x196c3671, 0x6e6b06e7,
            0xfed41b76, 0x89d32be0, 0x10da7a5a, 0x67dd4acc, 0xf9b9df6f, 0x8ebeeff9, 0x17b7be43, 0x60b08ed5,
            0xd6d6a3e8, 0xa1d1937e, 0x38d8c2c4, 0x4fdff252, 0xd1bb67f1, 0xa6bc5767, 0x3fb506dd, 0x48b2364b,
            0xd80d2bda, 0xaf0a1b4c, 0x36034af6, 0x41047a60, 0xdf60efc3, 0xa867df55, 0x316e8eef, 0x4669be79,
            0xcb61b38c, 0xbc66831a, 0x256fd2a0, 0x5268e236, 0xcc0c7795, 0xbb0b4703, 0x220216b9, 0x5505262f,
            0xc5ba3bbe, 0xb2bd0b28, 0x2bb45a92, 0x5cb36a04, 0xc2d7ffa7, 0xb5d0cf31, 0x2cd99e8b, 0x5bdeae1d,
            0x9b64c2b0, 0xec63f226, 0x756aa39c, 0x026d930a, 0x9c0906a9, 0xeb0e363f, 0x72076785, 0x05005713,
            0x95bf4a82, 0xe2b87a14, 0x7bb12bae, 0x0cb61b38, 0x92d28e9b, 0xe5d5be0d, 0x7cdcefb7, 0x0bdbdf21,
            0x86d3d2d4, 0xf1d4e242, 0x68ddb3f8, 0x1fda836e, 0x81be16cd, 0xf6b9265b, 0x6fb077e1, 0x18b74777,
            0x88085ae6, 0xff0f6a70, 0x66063bca, 0x11010b5c, 0x8f659eff, 0xf862ae69, 0x616bffd3, 0x166ccf45,
            0xa00ae278, 0xd70dd2ee, 0x4e048354, 0x3903b3c2, 0xa7672661, 0xd06016f7, 0x4969474d, 0x3e6e77db,
            0xaed16a4a, 0xd9d65adc, 0x40df0b66, 0x37d83bf0, 0xa9bcae53, 0xdebb9ec5, 0x47b2cf7f, 0x30b5ffe9,
            0xbdbdf21c, 0xcabac28a, 0x53b39330, 0x24b4a3a6, 0xbad03605, 0xcdd70693, 0x54de5729, 0x23d967bf,
            0xb3667a2e, 0xc4614ab8, 0x5d681b02, 0x2a6f2b94, 0xb40bbe37, 0xc30c8ea1, 0x5a05df1b, 0x2d02ef8d,
        };


        byte[] bytes =mac.getBytes();
        int crc = 0xffffffff;
        for (byte b : bytes) {
            crc = (crc >>> 8) ^ table[(crc ^ b) & 0xff];
        }

        // flip bits
        crc = crc ^ 0xffffffff;

        return crc;
        /**/
        
        
        
        
        /** /
       int crc = 0xffffffff;
       byte[] bytes =mac.getBytes();
       
        crc  = 0xFFFFFFFF;       // initial contents of LFBSR
        int poly = 0xEDB88320;   // reverse polynomial

        for (byte b : bytes) {
            int temp = (crc ^ b) & 0xff;

            // read 8 bits one at a time
            for (int i = 0; i < 8; i++) {
                if ((temp & 1) == 1) temp = (temp >>> 1) ^ poly;
                else                 temp = (temp >>> 1);
            }
            crc = (crc >>> 8) ^ temp;
        }

        // flip bits
        crc = crc ^ 0xffffffff;
        return 0xffffffffL & (long)crc;
        //return crc;
        /**/
    }//get
}



